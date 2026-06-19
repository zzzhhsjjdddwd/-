import bcrypt from 'bcrypt';
import db from './db.js';

// 检查是否已初始化（有任何 staff 就认为已初始化）
const anyStaff = db.prepare('SELECT COUNT(*) as c FROM staff').get() as any;
if (anyStaff.c === 0) {
  console.log('[seed] 首次启动：正在初始化示例数据...');

  const salt = 10;
  const adminHash = bcrypt.hashSync('admin123', salt);
  const staffHash = bcrypt.hashSync('staff123', salt);

  const insStaff = db.prepare(
    'INSERT INTO staff (username, password_hash, name, role, active) VALUES (?, ?, ?, ?, ?)'
  );
  insStaff.run('admin', adminHash, '云栖管理员', 'admin', 1);
  insStaff.run('staff', staffHash, '店员小王', 'staff', 1);

  const insCat = db.prepare(
    'INSERT INTO categories (name, slug, sort_order, active) VALUES (?, ?, ?, ?)'
  );
  const cats = [
    ['主厨推荐', 'recommend', 1, 1],
    ['轻食沙拉', 'salad', 2, 1],
    ['健康主食', 'grain', 3, 1],
    ['汤品炖菜', 'soup', 4, 1],
    ['饮品甜点', 'drink', 5, 1],
  ];
  cats.forEach((c: any) => insCat.run(...c));

  const insDish = db.prepare(
    `INSERT INTO dishes (category_id, name, description, price, image, tags, specs, stock, active, recommended, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const dishes: any[] = [
    [1, '藜麦鸡胸沙拉碗', '富含蛋白质的轻食碗，搭配牛油果与玉米粒', 38, '', '热销,低卡', null, 99, 1, 1, 1],
    [1, '三文鱼牛油果波奇', '挪威三文鱼切丁，搭配日式酱油与新鲜牛油果', 58, '', '新品,高蛋白', null, 99, 1, 1, 2],
    [2, '地中海烤蔬菜沙拉', '烤茄子、彩椒、西葫芦配羊奶酪与橄榄油', 42, '', '素食', null, 99, 1, 0, 1],
    [2, '凯撒鸡肉沙拉', '罗马生菜、帕玛森芝士、香脆面包丁', 36, '', '经典', null, 99, 1, 0, 2],
    [2, '羽衣甘蓝豆腐沙拉', '超级食物组合，富含纤维与植物蛋白', 34, '', '健身,素食', null, 99, 1, 0, 3],
    [3, '香蒜藜麦饭', '蒜香橄榄油拌制，搭配时蔬丁', 28, '', '', null, 99, 1, 0, 1],
    [3, '低GI糙米饭团拼盘', '三色糙米 + 海苔芝麻 + 烤南瓜', 32, '', '低GI', null, 99, 1, 0, 2],
    [3, '意式罗勒青酱面', '新鲜罗勒、松子与橄榄油手工制酱', 45, '', '意式', null, 99, 1, 0, 3],
    [3, '和风照烧鸡腿饭', '日式照烧汁，鸡腿肉鲜嫩多汁', 42, '', '热销', null, 99, 1, 0, 4],
    [4, '南瓜奶油浓汤', '日本南瓜慢炖，搭配椰奶与南瓜籽', 22, '', '暖胃,素食', null, 99, 1, 0, 1],
    [4, '番茄蔬菜浓汤', '多种蔬菜慢炖出的清润番茄浓汤', 18, '', '低卡', null, 99, 1, 0, 2],
    [4, '菌菇养生汤', '姬松茸、牛肝菌与鲜菇慢炖', 26, '', '养生', null, 99, 1, 0, 3],
    [5, '鲜榨橙汁', '当日新鲜橙子冷压，100% 果汁', 18, '', '鲜榨', null, 99, 1, 0, 1],
    [5, '抹茶拿铁', '宇治抹茶粉与鲜牛奶调和', 22, '', '热/冰', null, 99, 1, 0, 2],
    [5, '蜂蜜柠檬气泡水', '清新爽口的夏日饮品', 16, '', '冰饮', null, 99, 1, 0, 3],
    [5, '酸奶莓果杯', '希腊酸奶搭配当季莓果与燕麦脆', 28, '', '甜品,健康', null, 99, 1, 0, 4],
  ];
  dishes.forEach((d) => insDish.run(...d));

  // 餐桌
  const insTable = db.prepare(
    'INSERT INTO tables (code, seats, status) VALUES (?, ?, ?)'
  );
  [
    ['A1', 2, 'free'],
    ['A2', 2, 'free'],
    ['A3', 2, 'free'],
    ['B1', 4, 'free'],
    ['B2', 4, 'free'],
    ['B3', 4, 'free'],
    ['C1', 6, 'free'],
    ['C2', 8, 'free'],
  ].forEach((t: any) => insTable.run(...t));

  // 示例客户
  const insCust = db.prepare(
    'INSERT INTO customers (phone, name, points, level) VALUES (?, ?, ?, ?)'
  );
  insCust.run('13800000001', '李先生', 1280, '金卡');
  insCust.run('13800000002', '王小姐', 320, '银卡');

  console.log('[seed] 示例数据初始化完成 ✅');
} else {
  console.log('[seed] 数据库已存在，跳过初始化');
}
