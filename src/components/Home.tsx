import { ChangeEvent, useRef, useState } from 'react';
import { Check, Edit2, History as HistoryIcon, MapPin, X } from 'lucide-react';
import { motion } from 'motion/react';
import { HomeSettings, Order } from '../types';
import { uploadImages } from '../api';

interface HomeProps {
  settings: HomeSettings;
  onUpdateSettings: (settings: HomeSettings) => Promise<HomeSettings>;
  onStartOrdering: () => void;
  orders: Order[];
  onReorder: (order: Order) => void;
  onViewDetails: (order: Order) => void;
}

export default function Home({ settings, onUpdateSettings, onStartOrdering, orders, onReorder, onViewDetails }: HomeProps) {
  const [isEditingText, setIsEditingText] = useState(false);
  const [draftSettings, setDraftSettings] = useState(settings);
  const [isSavingText, setIsSavingText] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const dateString = lastMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  const lastMonthOrder = orders.find(order => order.date.startsWith(dateString));

  const startEditing = () => {
    setDraftSettings(settings);
    setErrorMessage('');
    setIsEditingText(true);
  };

  const cancelEditing = () => {
    setDraftSettings(settings);
    setErrorMessage('');
    setIsEditingText(false);
  };

  const saveTextSettings = async () => {
    setIsSavingText(true);
    setErrorMessage('');
    try {
      await onUpdateSettings({
        ...settings,
        greeting: draftSettings.greeting,
        titlePrefix: draftSettings.titlePrefix,
        titleHighlight: draftSettings.titleHighlight,
        titleSuffix: draftSettings.titleSuffix,
      });
      setIsEditingText(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '首页文字保存失败');
    } finally {
      setIsSavingText(false);
    }
  };

  const handleHeroUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingHero(true);
    setErrorMessage('');
    try {
      const [uploadedFile] = await uploadImages('home', [file]);
      if (uploadedFile) {
        await onUpdateSettings({ ...settings, heroImage: uploadedFile.url });
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '首页图片上传失败');
    } finally {
      setIsUploadingHero(false);
      e.target.value = '';
    }
  };

  return (
    <div className="pt-12 px-6 space-y-10 pb-32">
      {/* Hero Greeting Section */}
      <section className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            {isEditingText ? (
              <div className="flex-1 space-y-3">
                <input
                  value={draftSettings.greeting}
                  onChange={e => setDraftSettings(prev => ({ ...prev, greeting: e.target.value }))}
                  className="w-full rounded-xl border border-outline-variant/30 bg-white px-4 py-2 text-sm font-bold text-on-surface outline-none focus:border-primary"
                  placeholder="顶部问候语"
                  type="text"
                />
                <input
                  value={draftSettings.titlePrefix}
                  onChange={e => setDraftSettings(prev => ({ ...prev, titlePrefix: e.target.value }))}
                  className="w-full rounded-xl border border-outline-variant/30 bg-white px-4 py-2 text-sm font-bold text-on-surface outline-none focus:border-primary"
                  placeholder="标题第一行"
                  type="text"
                />
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <input
                    value={draftSettings.titleHighlight}
                    onChange={e => setDraftSettings(prev => ({ ...prev, titleHighlight: e.target.value }))}
                    className="min-w-0 rounded-xl border border-outline-variant/30 bg-white px-4 py-2 text-sm font-bold text-primary outline-none focus:border-primary"
                    placeholder="强调文字"
                    type="text"
                  />
                  <input
                    value={draftSettings.titleSuffix}
                    onChange={e => setDraftSettings(prev => ({ ...prev, titleSuffix: e.target.value }))}
                    className="w-24 rounded-xl border border-outline-variant/30 bg-white px-3 py-2 text-sm font-bold text-on-surface outline-none focus:border-primary"
                    placeholder="后缀"
                    type="text"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveTextSettings}
                    disabled={isSavingText}
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-white shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    {isSavingText ? '保存中...' : '保存文字'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={isSavingText}
                    className="flex h-10 w-12 items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant/60 border border-outline-variant/20 disabled:opacity-50"
                    aria-label="取消编辑"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-on-surface-variant font-bold text-[10px] uppercase tracking-[0.2em] opacity-60">{settings.greeting}</p>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-bold text-on-surface leading-tight tracking-tighter"
                >
                  {settings.titlePrefix}<br />
                  <span className="text-primary italic">{settings.titleHighlight}</span>{settings.titleSuffix}
                </motion.h1>
              </div>
            )}

            {!isEditingText && (
              <button
                type="button"
                onClick={startEditing}
                className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-lg shadow-primary/10 border border-outline-variant/20 transition-all hover:bg-primary hover:text-white active:scale-95"
                aria-label="编辑首页文字"
                title="编辑首页文字"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {errorMessage && (
            <div className="rounded-xl bg-error/10 px-4 py-3 text-xs font-bold text-error">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Hero Card */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative block w-full aspect-video rounded-3xl overflow-hidden glass-card custom-shadow border-none text-left group"
          aria-label="上传首页图片"
        >
          <img
            alt="Family Dinner"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            src={settings.heroImage}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
          {isUploadingHero && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-bold text-white">
              上传中...
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleHeroUpload}
            className="hidden"
          />
        </button>
      </section>

      {/* Main CTA */}
      <section className="flex flex-col items-center">
        <button
          onClick={onStartOrdering}
          className="w-full py-4 bg-primary text-white text-base font-bold rounded-2xl shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:translate-y-[-2px] active:translate-y-[1px] transition-all duration-300"
        >
          开始点餐
        </button>
        <p className="mt-4 text-on-surface-variant/40 text-[10px] font-bold uppercase tracking-widest">美味马上到来</p>
      </section>

      {/* Last Month Today Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-on-surface tracking-tight flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-primary" />
            上月今日
          </h2>
          <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">{dateString}</span>
        </div>

        {lastMonthOrder ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-3xl p-6 custom-shadow border-none bg-white/70 overflow-hidden relative"
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />

            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-on-surface leading-tight">{lastMonthOrder.items}</h3>
                  <div className="flex items-center gap-1 text-primary text-[10px] font-bold uppercase tracking-widest">
                    <MapPin className="w-3 h-3" />
                    温馨暖家
                  </div>
                </div>
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                  {lastMonthOrder.status}
                </div>
              </div>

              <p className="text-xs text-on-surface-variant/70 italic leading-relaxed">
                "{lastMonthOrder.note}"
              </p>

              <div className="flex gap-2">
                {lastMonthOrder.images.slice(0, 3).map((img, i) => (
                  <div key={i} className="w-16 h-16 rounded-xl overflow-hidden shadow-sm bg-surface-container">
                    <img src={img} alt="dish" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => onReorder(lastMonthOrder)}
                  className="flex-1 py-3 px-6 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-98 transition-all"
                >
                  再来一单
                </button>
                <button
                  onClick={() => onViewDetails(lastMonthOrder)}
                  className="px-6 py-3 bg-surface-container-low border border-outline-variant/10 text-on-surface-variant/70 rounded-xl font-bold text-xs hover:bg-surface-container-high active:scale-98 transition-all"
                >
                  查看详情
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="glass-card rounded-3xl p-8 border border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-center space-y-3 bg-surface-container/10">
            <div className="w-12 h-12 bg-surface-container rounded-2xl flex items-center justify-center text-2xl">🍃</div>
            <div>
              <p className="font-bold text-on-surface text-sm">上个月的今天还没有足迹</p>
              <p className="text-[10px] text-on-surface-variant/40 font-bold uppercase tracking-widest mt-1">从今天开始记录美好吧</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
