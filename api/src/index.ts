import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'node:url';

import db from './db.js';
import { signToken, verifyToken } from './auth.js';
import './seed.js'; // 首次启动初始化

// ===== 数据库迁移（按需添加字段） =====
try {
  const cols: any[] = db.prepare("PRAGMA table_info(orders)").all();
  const colNames = new Set(cols.map((c) => c.name));
  if (!colNames.has('customer_name'))
    db.prepare("ALTER TABLE orders ADD COLUMN customer_name TEXT").run();
  if (!colNames.has('customer_phone'))
    db.prepare("ALTER TABLE orders ADD COLUMN customer_phone TEXT").run();
} catch (e) { /* 迁移失败不影响服务启动 */ }

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// 信任反向代理（如 Cloudflare / Render / Nginx）
app.set('trust proxy', 1);

// 公开访问的健康检查
app.get('/health', (_req: Request, res: Response) => {
  res.json({ code: 0, message: 'ok', data: { uptime: process.uptime(), time: new Date().toISOString() } });
});

// ===================== 静态资源 =====================
const UPLOAD_DIR = path.resolve(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'public', 'uploads')));

// 前端生产构建
const CUST_DIST = path.resolve(__dirname, '..', '..', 'apps', 'customer', 'dist');
const MERCH_DIST = path.resolve(__dirname, '..', '..', 'apps', 'merchant', 'dist');
if (fs.existsSync(CUST_DIST)) {
  app.use('/customer', express.static(CUST_DIST));
  app.get('/customer/*', (_req, res) => res.sendFile(path.join(CUST_DIST, 'index.html')));
}
if (fs.existsSync(MERCH_DIST)) {
  app.use('/merchant', express.static(MERCH_DIST));
  app.get('/merchant/*', (_req, res) => res.sendFile(path.join(MERCH_DIST, 'index.html')));
}

// ===================== 工具函数 =====================
const ok = <T>(res: Response, data: T, message = 'ok') =>
  res.json({ code: 0, message, data });
const fail = (res: Response, message: string, code = 1, httpStatus = 400) =>
  res.status(httpStatus).json({ code, message, data: null });

function auth(req: Request, _res: Response, next: NextFunction) {
  const payload = verifyToken(req.headers.authorization);
  if (!payload) return next(Object.assign(new Error('Unauthorized'), { status: 401 }));
  (req as any).user = payload;
  next();
}
function adminOnly(req: Request, _res: Response, next: NextFunction) {
  const u = (req as any).user;
  if (!u || u.role !== 'admin')
    return next(Object.assign(new Error('Forbidden'), { status: 403 }));
  next();
}

// ===================== 图片上传 =====================
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `img-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.post('/api/upload/image', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) return fail(res, '未接收到文件');
  const url = `/uploads/${req.file.filename}`;
  ok(res, { url, filename: req.file.filename });
});

// ===================== 认证 =====================
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body || {};
  if (!username || !password) return fail(res, '用户名和密码不能为空');
  const row: any = db.prepare('SELECT * FROM staff WHERE username = ?').get(username);
  if (!row) return fail(res, '用户不存在', 1, 404);
  if (!bcrypt.compareSync(password, row.password_hash))
    return fail(res, '密码错误', 1, 401);
  const token = signToken({ id: row.id, username: row.username, role: row.role });
  ok(res, {
    token,
    user: { id: row.id, username: row.username, name: row.name, role: row.role },
  });
});

app.post('/api/auth/customer-login', (req: Request, res: Response) => {
  const { phone, code } = req.body || {};
  if (!phone) return fail(res, '手机号不能为空');
  // 开发环境：任何验证码 = 1234 视为通过
  if (code && code !== '1234') return fail(res, '验证码错误', 1, 401);
  let row: any = db.prepare('SELECT * FROM customers WHERE phone = ?').get(phone);
  if (!row) {
    const info = db
      .prepare('INSERT INTO customers (phone, name, points, level) VALUES (?, ?, 0, ?)');
    const r = info.run(phone, `食客${phone.slice(-4)}`, '普通');
    row = db.prepare('SELECT * FROM customers WHERE id = ?').get(r.lastInsertRowid);
  }
  const token = signToken({ id: row.id, username: row.phone, role: 'customer' });
  ok(res, {
    token,
    user: { id: row.id, phone: row.phone, name: row.name, level: row.level, points: row.points },
  });
});

// ===================== 分类 =====================
app.get('/api/categories', (_req: Request, res: Response) => {
  const list = db
    .prepare('SELECT * FROM categories ORDER BY sort_order ASC, id ASC')
    .all();
  ok(res, list);
});
app.post('/api/categories', auth, adminOnly, (req: Request, res: Response) => {
  const { name, slug, sort_order = 0, image, active = 1 } = req.body;
  if (!name) return fail(res, '分类名不能为空');
  const info = db
    .prepare(
      'INSERT INTO categories (name, slug, sort_order, image, active) VALUES (?, ?, ?, ?, ?)'
    )
    .run(name, slug || name, sort_order, image || null, active ? 1 : 0);
  const saved: any = db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid);
  ok(res, saved);
});
app.patch('/api/categories/:id', auth, adminOnly, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, slug, sort_order, image, active } = req.body;
  const cur: any = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!cur) return fail(res, '分类不存在', 1, 404);
  db.prepare(
    'UPDATE categories SET name=?, slug=?, sort_order=?, image=?, active=? WHERE id=?'
  ).run(
    name ?? cur.name,
    slug ?? cur.slug,
    sort_order ?? cur.sort_order,
    image ?? cur.image,
    active ?? cur.active,
    id
  );
  const saved: any = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  ok(res, saved);
});
app.delete('/api/categories/:id', auth, adminOnly, (req: Request, res: Response) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(Number(req.params.id));
  ok(res, null);
});

// ===================== 菜品 =====================
app.get('/api/dishes', (req: Request, res: Response) => {
  const { category_id, keyword, recommended, active } = req.query;
  const where: string[] = [];
  const params: any[] = [];
  if (category_id) {
    where.push('d.category_id = ?');
    params.push(Number(category_id));
  }
  if (keyword) {
    where.push('d.name LIKE ?');
    params.push(`%${keyword}%`);
  }
  if (recommended === '1') {
    where.push('d.recommended = 1');
  }
  if (active === '1') where.push('d.active = 1');
  const sql =
    'SELECT d.*, c.name AS category_name FROM dishes d LEFT JOIN categories c ON c.id = d.category_id' +
    (where.length ? ' WHERE ' + where.join(' AND ') : '') +
    ' ORDER BY d.sort_order ASC, d.id DESC';
  const list = db.prepare(sql).all(...params);
  ok(res, list);
});
app.get('/api/dishes/:id', (req: Request, res: Response) => {
  const row = db
    .prepare(
      'SELECT d.*, c.name AS category_name FROM dishes d LEFT JOIN categories c ON c.id=d.category_id WHERE d.id=?'
    )
    .get(Number(req.params.id));
  if (!row) return fail(res, '菜品不存在', 1, 404);
  ok(res, row);
});
app.post('/api/dishes', auth, adminOnly, (req: Request, res: Response) => {
  const {
    category_id,
    name,
    description,
    price,
    image,
    tags,
    specs,
    stock = 999,
    active = 1,
    recommended = 0,
    sort_order = 0,
  } = req.body;
  if (!name || price == null) return fail(res, '名称与价格不能为空');
  const info = db
    .prepare(
      `INSERT INTO dishes (category_id, name, description, price, image, tags, specs, stock, active, recommended, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      category_id || null,
      name,
      description || '',
      Number(price),
      image || null,
      tags || '',
      specs || null,
      Number(stock),
      active ? 1 : 0,
      recommended ? 1 : 0,
      Number(sort_order)
    );
  const savedDish: any = db.prepare('SELECT * FROM dishes WHERE id = ?').get(info.lastInsertRowid);
  ok(res, savedDish);
});
app.patch('/api/dishes/:id', auth, adminOnly, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const cur: any = db.prepare('SELECT * FROM dishes WHERE id = ?').get(id);
  if (!cur) return fail(res, '菜品不存在', 1, 404);
  const {
    category_id, name, description, price, image, tags, specs,
    stock, active, recommended, sort_order,
  } = req.body;
  db.prepare(
    `UPDATE dishes SET category_id=?, name=?, description=?, price=?, image=?, tags=?, specs=?, stock=?, active=?, recommended=?, sort_order=? WHERE id=?`
  ).run(
    category_id ?? cur.category_id,
    name ?? cur.name,
    description ?? cur.description,
    price ?? cur.price,
    image ?? cur.image,
    tags ?? cur.tags,
    specs ?? cur.specs,
    stock ?? cur.stock,
    active ?? cur.active,
    recommended ?? cur.recommended,
    sort_order ?? cur.sort_order,
    id
  );
  const saved: any = db.prepare('SELECT * FROM dishes WHERE id = ?').get(id);
  ok(res, saved);
});
app.delete('/api/dishes/:id', auth, adminOnly, (req: Request, res: Response) => {
  db.prepare('DELETE FROM dishes WHERE id = ?').run(Number(req.params.id));
  ok(res, null);
});

// ===================== 订单 =====================
function hydrateOrders(orders: any[]) {
  if (!orders.length) return orders;
  const ids = orders.map((o) => o.id);
  const placeholders = ids.map(() => '?').join(',');
  const items: any[] = db
    .prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders})`)
    .all(...ids);
  const byOrder = new Map<number, any[]>();
  items.forEach((it) => {
    if (!byOrder.has(it.order_id)) byOrder.set(it.order_id, []);
    // 归一化字段：数据库字段为 dish_name/price/quantity/spec/remark
    byOrder.get(it.order_id)!.push({
      id: it.id,
      name: it.dish_name || it.name,
      price: it.price,
      quantity: it.quantity,
      spec: it.spec,
      remark: it.remark,
    });
  });
  return orders.map((o) => ({ ...o, items: byOrder.get(o.id) || [] }));
}

app.get('/api/orders', (req: Request, res: Response) => {
  const { status, customer_id, limit, offset } = req.query;
  const where: string[] = [];
  const params: any[] = [];
  if (status && status !== 'all') {
    where.push('status = ?');
    params.push(status);
  }
  if (customer_id) {
    where.push('customer_id = ?');
    params.push(Number(customer_id));
  }
  // 优先取订单表的散客信息（o.customer_name/o.customer_phone），否则回退到会员表
  const sql =
    'SELECT o.id, o.order_no, o.customer_id, o.table_no, o.order_type, o.status, o.total, ' +
    ' o.payment_method, o.address, o.remark, o.created_at, o.updated_at, ' +
    ' COALESCE(o.customer_name, c.name) AS customer_name, ' +
    ' COALESCE(o.customer_phone, c.phone) AS customer_phone ' +
    ' FROM orders o LEFT JOIN customers c ON c.id=o.customer_id' +
    (where.length ? ' WHERE ' + where.join(' AND ') : '') +
    ' ORDER BY o.created_at DESC' +
    (limit ? ' LIMIT ' + Number(limit) : '') +
    (offset ? ' OFFSET ' + Number(offset) : '');
  const list: any[] = db.prepare(sql).all(...params);
  ok(res, hydrateOrders(list));
});

app.get('/api/orders/:id', (req: Request, res: Response) => {
  const sql =
    'SELECT o.id, o.order_no, o.customer_id, o.table_no, o.order_type, o.status, o.total, ' +
    ' o.payment_method, o.address, o.remark, o.created_at, o.updated_at, ' +
    ' COALESCE(o.customer_name, c.name) AS customer_name, ' +
    ' COALESCE(o.customer_phone, c.phone) AS customer_phone ' +
    ' FROM orders o LEFT JOIN customers c ON c.id=o.customer_id WHERE o.id = ?';
  const order: any = db.prepare(sql).get(Number(req.params.id));
  if (!order) return fail(res, '订单不存在', 1, 404);
  ok(res, hydrateOrders([order])[0]);
});

app.post('/api/orders', (req: Request, res: Response) => {
  const {
    customer_id, table_no, order_type = 'dine', items,
    payment_method = 'wechat', address, remark, total,
    customer_name, customer_phone,
  } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0)
    return fail(res, '购物车不能为空');
  const computedTotal = items.reduce(
    (sum: number, it: any) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0),
    0
  );
  const finalTotal = Number(total) || computedTotal;

  const order_no = 'YQ' + Date.now().toString().slice(-10) + Math.floor(Math.random() * 100);
  const ins = db.prepare(
    `INSERT INTO orders (order_no, customer_id, customer_name, customer_phone, table_no, order_type, status, total, payment_method, address, remark)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const info = ins.run(
    order_no, customer_id || null, customer_name || null, customer_phone || null,
    table_no || null, order_type, 'pending', finalTotal,
    payment_method, address || null, remark || null
  );
  const orderId = Number(info.lastInsertRowid);

  const insItem = db.prepare(
    `INSERT INTO order_items (order_id, dish_id, dish_name, price, quantity, spec, remark)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const tx = db.transaction((rows: any[]) => {
    for (const it of rows) {
      insItem.run(
        orderId,
        it.dish_id || null,
        it.name || it.dish_name,
        Number(it.price),
        Number(it.quantity),
        it.spec || null,
        it.remark || null
      );
    }
  });
  tx(items);

  // SSE 推送
  broadcast({ type: 'order:new', orderId, order_no, total: finalTotal });

  // 返回完整订单对象
  const fullOrder: any = db.prepare(
    'SELECT o.id, o.order_no, o.customer_id, o.customer_name, o.customer_phone, o.table_no, o.order_type, o.status, o.total, o.address, o.remark, o.created_at FROM orders o WHERE o.id = ?'
  ).get(orderId);
  ok(res, hydrateOrders([fullOrder])[0]);
});

app.patch('/api/orders/:id/status', auth, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  if (!status) return fail(res, 'status 必填');
  db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now','localtime') WHERE id = ?")
    .run(status, id);
  broadcast({ type: 'order:status', orderId: id, status });
  ok(res, { id, status });
});

// ===================== 餐桌 =====================
app.get('/api/tables', (_req: Request, res: Response) => {
  ok(res, db.prepare('SELECT * FROM tables ORDER BY code ASC').all());
});
app.post('/api/tables', auth, adminOnly, (req: Request, res: Response) => {
  const { code, seats = 2, status = 'free' } = req.body;
  if (!code) return fail(res, '桌号不能为空');
  const info = db.prepare('INSERT INTO tables (code, seats, status) VALUES (?, ?, ?)').run(code, seats, status);
  const saved: any = db.prepare('SELECT * FROM tables WHERE id = ?').get(info.lastInsertRowid);
  ok(res, saved);
});
app.patch('/api/tables/:id', auth, adminOnly, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { code, seats, status } = req.body;
  const cur: any = db.prepare('SELECT * FROM tables WHERE id = ?').get(id);
  if (!cur) return fail(res, '餐桌不存在', 1, 404);
  db.prepare('UPDATE tables SET code=?, seats=?, status=? WHERE id=?')
    .run(code ?? cur.code, seats ?? cur.seats, status ?? cur.status, id);
  const saved: any = db.prepare('SELECT * FROM tables WHERE id = ?').get(id);
  ok(res, saved);
});
app.delete('/api/tables/:id', auth, adminOnly, (req: Request, res: Response) => {
  db.prepare('DELETE FROM tables WHERE id = ?').run(Number(req.params.id));
  ok(res, null);
});

// ===================== 会员增强 =====================
app.post('/api/auth/send-code', (req: Request, res: Response) => {
  const { phone } = req.body || {};
  if (!/^1\d{10}$/.test(phone)) return fail(res, '手机号格式不正确');
  ok(res, { sent: true, demo_code: '1234', tip: '演示环境：验证码固定为 1234' });
});

app.get('/api/customers/:id', auth, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const customer: any = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  if (!customer) return fail(res, '会员不存在', 1, 404);
  const stats: any = db
    .prepare(
      `SELECT COUNT(*) AS order_count,
              COALESCE(SUM(total), 0) AS total_spent,
              MAX(created_at) AS last_order_at
         FROM orders WHERE customer_id = ?`
    )
    .get(id);
  ok(res, { ...customer, ...stats });
});

app.patch('/api/customers/:id', auth, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const cur: any = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  if (!cur) return fail(res, '会员不存在', 1, 404);
  const { name, phone, avatar, points, level } = req.body;
  db.prepare('UPDATE customers SET name=?, phone=?, avatar=?, points=?, level=? WHERE id=?').run(
    name ?? cur.name,
    phone ?? cur.phone,
    avatar ?? cur.avatar,
    points ?? cur.points,
    level ?? cur.level,
    id
  );
  const saved: any = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  ok(res, saved);
});

// ===================== 地址管理 =====================
app.get('/api/addresses', auth, (req: Request, res: Response) => {
  const customer_id = Number((req as any).user?.id);
  if (!customer_id) return fail(res, '未登录', 1, 401);
  const list = db
    .prepare('SELECT * FROM addresses WHERE customer_id = ? ORDER BY is_default DESC, id ASC')
    .all(customer_id);
  ok(res, list);
});
app.post('/api/addresses', auth, (req: Request, res: Response) => {
  const customer_id = Number((req as any).user?.id);
  if (!customer_id) return fail(res, '未登录', 1, 401);
  const { name, phone, address, is_default = 0 } = req.body;
  if (!name || !phone || !address) return fail(res, '姓名/手机号/地址不能为空');
  const tx = db.transaction(() => {
    if (is_default) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE customer_id = ?').run(customer_id);
    }
    const info = db
      .prepare(
        'INSERT INTO addresses (customer_id, name, phone, address, is_default) VALUES (?, ?, ?, ?, ?)'
      )
      .run(customer_id, name, phone, address, is_default ? 1 : 0);
    const saved: any = db.prepare('SELECT * FROM addresses WHERE id = ?').get(info.lastInsertRowid);
    return saved;
  });
  const saved = tx();
  ok(res, saved);
});
app.patch('/api/addresses/:id', auth, (req: Request, res: Response) => {
  const customer_id = Number((req as any).user?.id);
  const id = Number(req.params.id);
  const cur: any = db.prepare('SELECT * FROM addresses WHERE id = ?').get(id);
  if (!cur) return fail(res, '地址不存在', 1, 404);
  if (cur.customer_id !== customer_id) return fail(res, '无权修改', 1, 403);
  const { name, phone, address, is_default } = req.body;
  const tx = db.transaction(() => {
    if (is_default) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE customer_id = ?').run(customer_id);
    }
    db.prepare('UPDATE addresses SET name=?, phone=?, address=?, is_default=?, updated_at=datetime(\'now\',\'localtime\') WHERE id=?').run(
      name ?? cur.name,
      phone ?? cur.phone,
      address ?? cur.address,
      is_default != null ? (is_default ? 1 : 0) : cur.is_default,
      id
    );
    const saved: any = db.prepare('SELECT * FROM addresses WHERE id = ?').get(id);
    return saved;
  });
  const saved = tx();
  ok(res, saved);
});
app.delete('/api/addresses/:id', auth, (req: Request, res: Response) => {
  const customer_id = Number((req as any).user?.id);
  const id = Number(req.params.id);
  const cur: any = db.prepare('SELECT * FROM addresses WHERE id = ?').get(id);
  if (!cur) return fail(res, '地址不存在', 1, 404);
  if (cur.customer_id !== customer_id) return fail(res, '无权删除', 1, 403);
  db.prepare('DELETE FROM addresses WHERE id = ?').run(id);
  ok(res, null);
});
app.patch('/api/addresses/:id/default', auth, (req: Request, res: Response) => {
  const customer_id = Number((req as any).user?.id);
  const id = Number(req.params.id);
  const cur: any = db.prepare('SELECT * FROM addresses WHERE id = ?').get(id);
  if (!cur) return fail(res, '地址不存在', 1, 404);
  if (cur.customer_id !== customer_id) return fail(res, '无权修改', 1, 403);
  const tx = db.transaction(() => {
    db.prepare('UPDATE addresses SET is_default = 0 WHERE customer_id = ?').run(customer_id);
    db.prepare('UPDATE addresses SET is_default = 1 WHERE id = ?').run(id);
  });
  tx();
  const saved: any = db.prepare('SELECT * FROM addresses WHERE id = ?').get(id);
  ok(res, saved);
});

// ===================== 支付对接 =====================
app.post('/api/payments/prepay', (req: Request, res: Response) => {
  const { order_id, method = 'wechat' } = req.body;
  if (!order_id) return fail(res, 'order_id 必填');
  const order: any = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(order_id));
  if (!order) return fail(res, '订单不存在', 1, 404);
  const customer_id = Number((req as any).user?.id) || Number(order.customer_id) || null;
  const third_party_id = 'DEMO_' + Date.now();
  const info = db
    .prepare(
      'INSERT INTO payments (order_id, customer_id, method, amount, status, third_party_id) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(Number(order_id), customer_id, method, Number(order.total), 'pending', third_party_id);
  const saved: any = db.prepare('SELECT * FROM payments WHERE id = ?').get(info.lastInsertRowid);
  ok(res, {
    payment_id: saved.id,
    method,
    amount: order.total,
    third_party_id,
    demo_tip: '演示环境：请调用 POST /api/payments/:id/notify 模拟支付成功',
  });
});
app.post('/api/payments/:id/notify', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const pay: any = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
  if (!pay) return fail(res, '支付记录不存在', 1, 404);
  if (pay.status === 'success') return ok(res, { ...pay });
  const tx = db.transaction(() => {
    db.prepare('UPDATE payments SET status = ? WHERE id = ?').run('success', id);
    const order: any = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(pay.order_id));
    if (order && order.status === 'pending') {
      db.prepare("UPDATE orders SET status = 'paid', updated_at = datetime('now','localtime') WHERE id = ?").run(Number(pay.order_id));
    }
    if (order && order.customer_id) {
      const addPoints = Math.floor(Number(pay.amount) || 0);
      if (addPoints > 0) {
        db.prepare('UPDATE customers SET points = COALESCE(points,0) + ? WHERE id = ?').run(addPoints, Number(order.customer_id));
      }
    }
  });
  tx();
  const saved: any = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
  broadcast({ type: 'payment:success', payment_id: id, order_id: pay.order_id, amount: pay.amount });
  ok(res, saved);
});
app.get('/api/payments/:order_id', auth, (req: Request, res: Response) => {
  const order_id = Number(req.params.order_id);
  const list = db
    .prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC')
    .all(order_id);
  ok(res, list);
});

// ===================== 小票打印 =====================
app.get('/api/orders/:id/receipt', auth, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const order: any = db
    .prepare(
      'SELECT o.id, o.order_no, o.customer_id, o.table_no, o.order_type, o.status, o.total, ' +
      ' o.payment_method, o.address, o.remark, o.created_at, ' +
      ' COALESCE(o.customer_name, c.name) AS customer_name, ' +
      ' COALESCE(o.customer_phone, c.phone) AS customer_phone ' +
      ' FROM orders o LEFT JOIN customers c ON c.id=o.customer_id WHERE o.id = ?'
    )
    .get(id);
  if (!order) return fail(res, '订单不存在', 1, 404);
  const items: any[] = db
    .prepare('SELECT * FROM order_items WHERE order_id = ?')
    .all(id)
    .map((it: any) => ({
      name: it.dish_name || it.name,
      qty: it.quantity,
      price: it.price,
      amount: Number((it.quantity || 0) * (it.price || 0)).toFixed(2),
    }));
  const typeText =
    order.order_type === 'dine'
      ? `堂食 ${order.table_no || ''}`.trim()
      : order.order_type === 'takeout'
      ? '外带'
      : `配送 ${order.address || ''}`.trim();
  ok(res, {
    title: '云栖浅食 · 点餐凭证',
    order_no: order.order_no,
    time: order.created_at,
    customer: order.customer_name || '散客',
    phone: order.customer_phone || '',
    type: typeText,
    items,
    total: order.total,
    remark: order.remark,
    footer: '感谢光临 · 客服电话 400-000-0000',
  });
});
app.post('/api/orders/:id/print', auth, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const staff_id = Number((req as any).user?.id) || null;
  const { type = 'receipt', content } = req.body;
  const order: any = db.prepare('SELECT id FROM orders WHERE id = ?').get(id);
  if (!order) return fail(res, '订单不存在', 1, 404);
  const info = db
    .prepare('INSERT INTO print_logs (order_id, staff_id, type, content) VALUES (?, ?, ?, ?)')
    .run(id, staff_id, type, content || null);
  const saved: any = db.prepare('SELECT * FROM print_logs WHERE id = ?').get(info.lastInsertRowid);
  ok(res, saved);
});

// ===================== 会员 / 员工 =====================
app.get('/api/members', (_req: Request, res: Response) => {
  ok(res, db.prepare('SELECT * FROM customers ORDER BY id DESC').all());
});
app.post('/api/members', auth, adminOnly, (req: Request, res: Response) => {
  const { phone, name, level = '普通', points = 0 } = req.body;
  const info = db
    .prepare('INSERT INTO customers (phone, name, level, points) VALUES (?, ?, ?, ?)')
    .run(phone || null, name || '', level, Number(points));
  const saved: any = db.prepare('SELECT * FROM customers WHERE id = ?').get(info.lastInsertRowid);
  ok(res, saved);
});

app.get('/api/staff', auth, adminOnly, (_req: Request, res: Response) => {
  ok(
    res,
    db
      .prepare('SELECT id, username, name, role, active FROM staff ORDER BY id ASC')
      .all()
  );
});
app.post('/api/staff', auth, adminOnly, (req: Request, res: Response) => {
  const { username, password, name, role = 'staff' } = req.body;
  if (!username || !password) return fail(res, '用户名/密码不能为空');
  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO staff (username, password_hash, name, role, active) VALUES (?, ?, ?, ?, 1)')
    .run(username, hash, name || '', role);
  const saved: any = db.prepare('SELECT id, username, name, role, active FROM staff WHERE id = ?').get(info.lastInsertRowid);
  ok(res, saved);
});

// ===================== 报表 =====================
app.get('/api/reports/summary', (_req: Request, res: Response) => {
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders: any = db
    .prepare(
      `SELECT COUNT(*) AS count, COALESCE(SUM(total),0) AS revenue FROM orders WHERE DATE(created_at)=?`
    )
    .get(today);
  const totalOrders: any = db.prepare('SELECT COUNT(*) AS c FROM orders').get();
  const totalRevenue: any = db.prepare('SELECT COALESCE(SUM(total),0) AS s FROM orders').get();
  const avgPrice: any = db.prepare(
    'SELECT COALESCE(AVG(total),0) AS a FROM orders WHERE total>0'
  ).get();
  ok(res, {
    today_count: todayOrders.count,
    today_revenue: todayOrders.revenue,
    total_count: totalOrders.c,
    total_revenue: totalRevenue.s,
    avg_price: avgPrice.a,
  });
});

app.get('/api/reports/trend', (_req: Request, res: Response) => {
  // 最近 7 天
  const rows: any[] = db.prepare(
    `SELECT DATE(created_at) AS day, COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue
     FROM orders WHERE created_at >= DATE('now','-6 days') GROUP BY DATE(created_at) ORDER BY day ASC`
  ).all();
  const map = new Map(rows.map((r) => [r.day, r]));
  const result: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const day = d.toISOString().slice(0, 10);
    const r = map.get(day);
    result.push({ day, orders: r?.orders || 0, revenue: r?.revenue || 0 });
  }
  ok(res, result);
});

app.get('/api/reports/dishes', (_req: Request, res: Response) => {
  const rows: any[] = db.prepare(
    `SELECT dish_name AS name, SUM(quantity) AS qty, SUM(quantity*price) AS revenue
     FROM order_items GROUP BY dish_name ORDER BY qty DESC LIMIT 10`
  ).all();
  ok(res, rows);
});

// ===================== SSE 实时流 =====================
interface SSEClient { id: number; res: Response; }
const clients = new Set<SSEClient>();
let clientId = 0;

function broadcast(event: any) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  clients.forEach((c) => {
    try { c.res.write(data); } catch (e) { /* ignore */ }
  });
}

app.get('/api/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders?.();

  const c: SSEClient = { id: ++clientId, res };
  clients.add(c);
  res.write(`data: ${JSON.stringify({ type: 'hello', ts: Date.now() })}\n\n`);

  const heartbeat = setInterval(() => {
    try { res.write(`: ping ${Date.now()}\n\n`); } catch (e) { /* ignore */ }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(c);
  });
});

// ===================== 根路由 =====================
app.get('/api/health', (_req, res) => ok(res, { status: 'up', ts: Date.now() }));

// 错误处理
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ code: 1, message: err.message || '服务器错误', data: null });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 云栖浅食 API 已启动  http://0.0.0.0:${PORT}`);
  console.log(`   /api/health          健康检查`);
  console.log(`   /api/stream          SSE 实时流\n`);
});
