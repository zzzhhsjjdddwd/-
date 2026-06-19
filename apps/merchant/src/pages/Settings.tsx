import { useEffect, useState } from 'react';
import { Save, Phone, MapPin, Store, Settings as SettingsIcon, Printer, FileText, Award, RefreshCw } from 'lucide-react';
import { useToast } from '../components/Toast';

interface ShopSettings {
  name: string;
  phone: string;
  address: string;
}

interface ReceiptSettings {
  header: string;
  footer: string;
  showLogo: boolean;
}

interface PrintSettings {
  mode: 'auto' | 'manual';
  printerModel: string;
}

interface LevelConfig {
  level: string;
  threshold: number;
}

const DEFAULTS: {
  shop: ShopSettings;
  receipt: ReceiptSettings;
  print: PrintSettings;
  levels: LevelConfig[];
} = {
  shop: { name: '云栖浅食', phone: '', address: '' },
  receipt: { header: '感谢您的惠顾！', footer: '欢迎再次光临', showLogo: true },
  print: { mode: 'manual', printerModel: '' },
  levels: [
    { level: '普通', threshold: 0 },
    { level: '银卡', threshold: 500 },
    { level: '金卡', threshold: 2000 },
    { level: '钻石', threshold: 5000 },
  ],
};

const LS_KEYS = {
  shop: 'yunqi-shop',
  receipt: 'yunqi-receipt',
  print: 'yunqi-print',
  levels: 'yunqi-levels',
};

function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  return fallback;
}

function saveLS<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export default function Settings() {
  const [shop, setShop] = useState<ShopSettings>(() => loadLS(LS_KEYS.shop, DEFAULTS.shop));
  const [receipt, setReceipt] = useState<ReceiptSettings>(() => loadLS(LS_KEYS.receipt, DEFAULTS.receipt));
  const [print, setPrint] = useState<PrintSettings>(() => loadLS(LS_KEYS.print, DEFAULTS.print));
  const [levels, setLevels] = useState<LevelConfig[]>(() => loadLS(LS_KEYS.levels, DEFAULTS.levels));
  const toast = useToast();

  useEffect(() => { saveLS(LS_KEYS.shop, shop); }, [shop]);
  useEffect(() => { saveLS(LS_KEYS.receipt, receipt); }, [receipt]);
  useEffect(() => { saveLS(LS_KEYS.print, print); }, [print]);
  useEffect(() => { saveLS(LS_KEYS.levels, levels); }, [levels]);

  const saveAll = () => {
    saveLS(LS_KEYS.shop, shop);
    saveLS(LS_KEYS.receipt, receipt);
    saveLS(LS_KEYS.print, print);
    saveLS(LS_KEYS.levels, levels);
    toast.push('所有设置已保存');
  };

  const resetAll = () => {
    if (!confirm('确认恢复为默认设置？')) return;
    setShop(DEFAULTS.shop);
    setReceipt(DEFAULTS.receipt);
    setPrint(DEFAULTS.print);
    setLevels(DEFAULTS.levels);
    toast.push('已恢复默认设置');
  };

  const updateLevel = (index: number, field: keyof LevelConfig, value: string) => {
    setLevels((prev) => prev.map((l, i) => i === index ? { ...l, [field]: field === 'threshold' ? Number(value) || 0 : value } : l));
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="text-xs text-muted tracking-[0.3em] mb-1">SETTINGS</div>
          <h1 className="font-serif text-2xl md:text-3xl text-ink-500">系统设置</h1>
          <p className="text-sm text-muted mt-1">配置店铺信息、小票模板、打印设置与会员等级</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetAll} className="btn-porcelain flex items-center gap-2 !py-2.5 !px-5 text-sm">
            <RefreshCw size={15} /> 恢复默认
          </button>
          <button onClick={saveAll} className="btn-gold flex items-center gap-2 !py-2.5 !px-5 text-sm">
            <Save size={15} /> 保存设置
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 店铺设置 */}
        <div className="card-porcelain p-6">
          <div className="flex items-start gap-3 mb-5 pb-4 border-b border-gold-500/10">
            <div className="w-11 h-11 rounded-2xl bg-gradient-gold flex items-center justify-center text-white shadow-gold flex-shrink-0">
              <Store size={20} />
            </div>
            <div>
              <div className="text-xs text-muted tracking-widest mb-1">SHOP</div>
              <h3 className="font-serif text-lg text-ink-500">店铺设置</h3>
              <p className="text-xs text-muted mt-1">店铺基础信息，将显示在小票与界面标题处</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label text-xs text-muted flex items-center gap-1.5 mb-2">
                <Store size={12} /> 店铺名称
              </label>
              <input value={shop.name} onChange={(e) => setShop({ ...shop, name: e.target.value })} className="input-gold" placeholder="如：云栖浅食" />
            </div>
            <div>
              <label className="label text-xs text-muted flex items-center gap-1.5 mb-2">
                <Phone size={12} /> 客服电话
              </label>
              <input value={shop.phone} onChange={(e) => setShop({ ...shop, phone: e.target.value })} className="input-gold" placeholder="如：0571-88888888" />
            </div>
            <div>
              <label className="label text-xs text-muted flex items-center gap-1.5 mb-2">
                <MapPin size={12} /> 店铺地址
              </label>
              <textarea
                value={shop.address} onChange={(e) => setShop({ ...shop, address: e.target.value })}
                className="input-gold min-h-[90px]" placeholder="详细地址"
              />
            </div>
          </div>
        </div>

        {/* 小票模板 */}
        <div className="card-porcelain p-6">
          <div className="flex items-start gap-3 mb-5 pb-4 border-b border-gold-500/10">
            <div className="w-11 h-11 rounded-2xl bg-gradient-gold flex items-center justify-center text-white shadow-gold flex-shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <div className="text-xs text-muted tracking-widest mb-1">RECEIPT</div>
              <h3 className="font-serif text-lg text-ink-500">小票模板</h3>
              <p className="text-xs text-muted mt-1">打印小票的页眉、页脚文字与 Logo 显示</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label text-xs text-muted mb-2">页眉文字</label>
              <input value={receipt.header} onChange={(e) => setReceipt({ ...receipt, header: e.target.value })} className="input-gold" placeholder="如：感谢您的惠顾！" />
            </div>
            <div>
              <label className="label text-xs text-muted mb-2">页脚文字</label>
              <input value={receipt.footer} onChange={(e) => setReceipt({ ...receipt, footer: e.target.value })} className="input-gold" placeholder="如：欢迎再次光临" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl border border-gold-500/15 bg-gold-500/5">
              <div>
                <div className="text-sm text-ink-500 font-medium">显示店铺 Logo</div>
                <div className="text-xs text-muted mt-0.5">在小票顶部显示店铺名称</div>
              </div>
              <button
                onClick={() => setReceipt({ ...receipt, showLogo: !receipt.showLogo })}
                className={`relative w-12 h-7 rounded-full transition-colors ${receipt.showLogo ? 'bg-gradient-gold shadow-gold' : 'bg-gold-500/20'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${receipt.showLogo ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* 小票预览 */}
          <div className="mt-5 pt-4 border-t border-gold-500/10">
            <div className="text-xs text-muted tracking-widest mb-3">PREVIEW · 小票预览</div>
            <div className="bg-white rounded-2xl p-4 border border-gold-500/15 mx-auto max-w-[260px]">
              {receipt.showLogo && <div className="text-center font-serif text-base font-bold text-ink-500 mb-1">{shop.name || '云栖浅食'}</div>}
              <div className="text-center text-xs text-muted mb-2">{receipt.header}</div>
              <div className="divider-gold my-2" />
              <div className="text-xs text-muted mb-1">订单号：#202501001</div>
              <div className="text-xs text-muted mb-1">时间：{new Date().toLocaleString('zh-CN')}</div>
              <div className="divider-gold my-2" />
              <div className="flex justify-between text-xs mb-1"><span>招牌轻食 × 1</span><span className="font-serif">¥38.00</span></div>
              <div className="flex justify-between text-xs mb-1"><span>招牌沙拉 × 2</span><span className="font-serif">¥96.00</span></div>
              <div className="divider-gold my-2" />
              <div className="flex justify-between font-bold font-serif"><span>合计</span><span>¥134.00</span></div>
              <div className="divider-gold my-2" />
              <div className="text-center text-xs text-muted">{receipt.footer}</div>
              {shop.phone && <div className="text-center text-xs text-muted mt-1">电话：{shop.phone}</div>}
              {shop.address && <div className="text-center text-xs text-muted">{shop.address}</div>}
            </div>
          </div>
        </div>

        {/* 打印设置 */}
        <div className="card-porcelain p-6">
          <div className="flex items-start gap-3 mb-5 pb-4 border-b border-gold-500/10">
            <div className="w-11 h-11 rounded-2xl bg-gradient-gold flex items-center justify-center text-white shadow-gold flex-shrink-0">
              <Printer size={20} />
            </div>
            <div>
              <div className="text-xs text-muted tracking-widest mb-1">PRINT</div>
              <h3 className="font-serif text-lg text-ink-500">打印设置</h3>
              <p className="text-xs text-muted mt-1">小票打印模式与打印机型号配置</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label text-xs text-muted mb-2">打印模式</label>
              <div className="grid grid-cols-2 gap-3">
                {(['auto', 'manual'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setPrint({ ...print, mode })}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      print.mode === mode
                        ? 'border-gold-500/40 bg-gradient-gold text-white shadow-gold'
                        : 'border-gold-500/15 bg-white hover:border-gold-500/30'
                    }`}
                  >
                    <div className="font-serif font-semibold text-sm mb-1">{mode === 'auto' ? '自动打印' : '手动打印'}</div>
                    <div className={`text-xs ${print.mode === mode ? 'text-white/80' : 'text-muted'}`}>
                      {mode === 'auto' ? '订单完成后自动打印小票' : '需点击打印按钮手动输出'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label text-xs text-muted mb-2">打印机型号</label>
              <input
                value={print.printerModel}
                onChange={(e) => setPrint({ ...print, printerModel: e.target.value })}
                className="input-gold"
                placeholder="如：XP-80C / 80mm 热敏打印机"
              />
              <div className="text-xs text-muted mt-2">当前模式：<span className="text-gold-700 font-medium">{print.mode === 'auto' ? '自动打印' : '手动打印'}</span>
                {print.printerModel && <> · 打印机：<span className="text-gold-700 font-medium">{print.printerModel}</span></>}
              </div>
            </div>
          </div>
        </div>

        {/* 会员等级配置 */}
        <div className="card-porcelain p-6">
          <div className="flex items-start gap-3 mb-5 pb-4 border-b border-gold-500/10">
            <div className="w-11 h-11 rounded-2xl bg-gradient-gold flex items-center justify-center text-white shadow-gold flex-shrink-0">
              <Award size={20} />
            </div>
            <div>
              <div className="text-xs text-muted tracking-widest mb-1">LEVELS</div>
              <h3 className="font-serif text-lg text-ink-500">会员等级</h3>
              <p className="text-xs text-muted mt-1">设置各等级名称及所需积分阈值</p>
            </div>
          </div>

          <div className="space-y-3">
            {levels.map((lv, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-gold-500/5 border border-gold-500/10">
                <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center text-white font-serif font-semibold shadow-gold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    value={lv.level}
                    onChange={(e) => updateLevel(i, 'level', e.target.value)}
                    className="input-gold !py-2 !text-sm !font-serif !font-semibold"
                    placeholder="等级名称"
                  />
                </div>
                <div className="text-xs text-muted whitespace-nowrap">需达到</div>
                <div className="w-28">
                  <input
                    type="number"
                    value={lv.threshold}
                    onChange={(e) => updateLevel(i, 'threshold', e.target.value)}
                    className="input-gold !py-2 !text-sm font-serif"
                  />
                </div>
                <div className="text-xs text-muted whitespace-nowrap">积分</div>
              </div>
            ))}
          </div>

          {/* 等级预览 */}
          <div className="mt-5 pt-4 border-t border-gold-500/10">
            <div className="text-xs text-muted tracking-widest mb-3">OVERVIEW · 等级一览</div>
            <div className="bg-white rounded-2xl p-4 border border-gold-500/15">
              <div className="flex flex-wrap items-center gap-2">
                {levels.map((lv, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="tag bg-gold-500/10 text-gold-700 border-gold-500/30">{lv.level}</span>
                    <span className="text-xs text-muted font-serif">≥ {lv.threshold}</span>
                    {i < levels.length - 1 && <span className="text-gold-500/30 mx-1">→</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部保存条 */}
      <div className="card-glass p-5 mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SettingsIcon size={16} className="text-gold-700" />
          <span className="text-sm text-muted">所有设置存储于本地浏览器，不同设备需独立配置</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetAll} className="btn-porcelain !py-2 !px-5 text-sm flex items-center gap-1.5">
            <RefreshCw size={12} /> 恢复默认
          </button>
          <button onClick={saveAll} className="btn-gold !py-2 !px-5 text-sm flex items-center gap-1.5">
            <Save size={12} /> 保存所有设置
          </button>
        </div>
      </div>
    </div>
  );
}
