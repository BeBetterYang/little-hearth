import { ChangeEvent, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ImagePlus, X } from 'lucide-react';
import { Order, Dish } from '../types';
import { uploadImages } from '../api';

interface MenuProps {
  dishes: Dish[];
  onToggleReady: (id: string) => void | Promise<void>;
  onComplete: (order: Order) => void | Promise<void>;
}

export default function Menu({ dishes, onToggleReady, onComplete }: MenuProps) {
  const [showMealOptions, setShowMealOptions] = useState(false);
  const [note, setNote] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleReady = (id: string) => {
    onToggleReady(id);
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    const files: File[] = Array.from(fileList);
    if (files.length === 0) return;

    setIsUploading(true);
    setErrorMessage('');
    try {
      const uploadedFiles = await uploadImages('orders', files);
      setImages(prev => [...prev, ...uploadedFiles.map(file => file.url)]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '图片上传失败');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const readyCount = dishes.filter(d => d.ready).length;
  const hasDishes = dishes.length > 0;
  const progressPercent = dishes.length > 0 ? (readyCount / dishes.length) * 100 : 0;
  const progressLabel = !hasDishes ? '还没有点餐哦' : readyCount === dishes.length ? '大功告成! 🎉' : '加油! 🥟';

  const handleFinish = async (mealType: string) => {
    const readyDishes = dishes.filter(d => d.ready);
    if (readyDishes.length === 0) return;
    const now = new Date();
    const dateKey = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');

    // Use user-provided images if any, otherwise fallback to dish images
    const orderImages = images.length > 0 ? images : readyDishes.slice(0, 2).map(d => d.img);

    const newOrder: Order = {
      dateKey,
      date: now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) + " · " + mealType,
      items: readyDishes[0].name + (readyDishes.length > 1 ? ` 等${readyDishes.length}件菜品` : ""),
      note: note || "这一餐真的很棒，全家人都很喜欢。",
      status: "已完成",
      images: orderImages,
      extra: Math.max(0, readyDishes.length - orderImages.length)
    };

    setIsCompleting(true);
    setErrorMessage('');
    try {
      await onComplete(newOrder);
      setNote('');
      setImages([]);
      setShowMealOptions(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '保存用餐记录失败');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="pt-12 px-6 space-y-8 pb-32">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-on-surface tracking-tight font-headline">今日菜单</h1>
          <p className="text-on-surface-variant/70 text-sm font-medium">温馨的家庭晚餐时间</p>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowMealOptions(!showMealOptions)}
            disabled={readyCount === 0 || isCompleting}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
          >
            {isCompleting ? '保存中...' : '完成啦 ✨'}
          </button>
          
          <AnimatePresence>
            {showMealOptions && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 top-full mt-3 w-32 bg-white rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden z-50 p-2 space-y-1"
              >
                {['早餐', '午餐', '晚餐'].map((meal) => (
                  <button
                    key={meal}
                    onClick={() => handleFinish(meal)}
                    className="w-full py-2 hover:bg-primary/5 rounded-xl text-on-surface font-bold text-sm transition-colors text-center"
                  >
                    {meal}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl bg-error/10 px-4 py-3 text-xs font-bold text-error">
          {errorMessage}
        </div>
      )}

      {/* Menu Progress Card */}
      <section className="glass-card p-6 rounded-2xl custom-shadow relative overflow-hidden bg-white/50">
        <div className="flex justify-between items-end relative z-10 mb-4">
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-1">进度报告</p>
            <h2 className="text-2xl font-bold text-on-surface tracking-tight">{readyCount}/{dishes.length} 道菜已就绪</h2>
          </div>
          <div className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-lg font-bold text-xs">
            {progressLabel}
          </div>
        </div>
        <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-primary rounded-full shadow-sm shadow-primary/20"
          />
        </div>
      </section>

      {/* Dish List */}
      <div className="space-y-4">
        {dishes.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-outline-variant/30 bg-white/40 px-6 py-12 text-center">
            <p className="text-sm font-bold text-on-surface">还没有点餐哦</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">去点餐页挑几道今天想吃的菜吧</p>
          </div>
        ) : dishes.map((dish, i) => (
          <motion.div 
            key={dish.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => toggleReady(dish.id)}
            className={`glass-card p-4 rounded-xl flex items-center gap-4 transition-all cursor-pointer custom-shadow ${dish.ready ? 'bg-white border-primary/20' : 'bg-white/40'}`}
          >
            <div className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container relative ${dish.ready ? 'opacity-100' : 'opacity-60'}`}>
              <img 
                alt={dish.name} 
                className="w-full h-full object-cover" 
                src={dish.img}
                referrerPolicy="no-referrer"
              />
              {!dish.ready && <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px]" />}
            </div>
            <div className="flex-grow">
              <h3 className={`text-base font-bold transition-colors ${dish.ready ? 'text-on-surface' : 'text-on-surface-variant/40'}`}>{dish.name}</h3>
              <div className="flex gap-2 mt-1">
                {dish.tags.map((tag, j) => (
                  <span 
                    key={j}
                    className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-tight transition-all ${dish.ready ? 'bg-primary-container text-primary' : 'bg-surface-container-high text-on-surface-variant/30'}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${dish.ready ? 'border-primary bg-primary text-white shadow-md shadow-primary/10' : 'border-outline-variant/30 bg-surface-container-low text-transparent'}`}>
                <Check className={`w-4 h-4 font-bold ${dish.ready ? 'block' : 'hidden'}`} />
              </div>
              <span className={`text-[10px] font-bold transition-all ${dish.ready ? 'text-primary' : 'text-on-surface-variant/40'}`}>
                {dish.ready ? '已准备' : '待处理'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Order Note Card */}
      <section className="glass-card p-6 rounded-2xl custom-shadow bg-white/50 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Check className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-on-surface text-lg tracking-tight">订单备注</h3>
        </div>
        
        <div className="space-y-4">
          <textarea 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="写下这顿饭的点滴回忆..."
            className="w-full bg-surface-container-low rounded-xl p-4 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/30 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none min-h-[100px] transition-all"
          />

          <div className="space-y-3">
            <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">生活碎片 (图片)</p>
            <div className="flex flex-wrap gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden shadow-sm group">
                  <img src={img} alt="preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 p-1 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center gap-1 text-on-surface-variant/40 hover:bg-surface-container-high transition-all"
              >
                <ImagePlus className="w-6 h-6" />
                <span className="text-[9px] font-bold">{isUploading ? '上传中' : '上传'}</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                multiple
                className="hidden"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
