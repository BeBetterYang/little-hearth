import { motion, AnimatePresence } from 'motion/react';
import { Camera, Utensils, Leaf, Soup, CookingPot, Plus, Trash2, Edit2, X, Check, Search } from 'lucide-react';
import { Dish } from '../types';
import { ChangeEvent, useState } from 'react';
import { searchDishImage, uploadImages } from '../api';

interface DishesProps {
  dishes: Dish[];
  onUpdate: (dish: Dish) => void | Promise<void>;
  onAdd: (dish: Dish) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export default function Dishes({ dishes, onUpdate, onAdd, onDelete }: DishesProps) {
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSearchingImage, setIsSearchingImage] = useState(false);
  const [formError, setFormError] = useState('');

  const initialDish: Dish = {
    id: Math.random().toString(36).substr(2, 9),
    name: '',
    tags: ['素菜'],
    img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop',
    ready: false,
    desc: ''
  };

  const [formData, setFormData] = useState<Dish>(initialDish);

  const handleEdit = (dish: Dish) => {
    setEditingDish(dish);
    setFormData({ ...dish });
    setIsAdding(false);
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setEditingDish(null);
    setFormData({ ...initialDish, id: Math.random().toString(36).substr(2, 9) });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setIsSaving(true);
    setFormError('');
    try {
      if (isAdding) {
        await onAdd(formData);
      } else if (editingDish) {
        await onUpdate(formData);
      }

      setEditingDish(null);
      setIsAdding(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '保存失败，请稍后再试');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFormError('');
    try {
      const [uploadedFile] = await uploadImages('dishes', [file]);
      if (uploadedFile) {
        setFormData(prev => ({ ...prev, img: uploadedFile.url }));
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '图片上传失败');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSearchDishImage = async () => {
    const dishName = formData.name.trim();
    if (!dishName) {
      setFormError('请先输入菜品名称');
      return;
    }

    setIsSearchingImage(true);
    setFormError('');
    try {
      const image = await searchDishImage(dishName);
      setFormData(prev => ({ ...prev, img: image.url }));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '没有找到合适的菜品图片');
    } finally {
      setIsSearchingImage(false);
    }
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, img: '' }));
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [tag]
    }));
  };

  const filteredDishes = dishes.filter(dish => 
    dish.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-2xl px-6 pt-12 pb-32 flex flex-col gap-8 mx-auto">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <motion.h1 
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold tracking-tight text-on-surface font-headline"
          >
            菜品实验室
          </motion.h1>
          <p className="text-on-surface-variant/60 text-sm font-medium">定制你的家庭专属菜单</p>
        </div>
        {!editingDish && !isAdding && (
          <button 
            onClick={handleAddNew}
            className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {(editingDish || isAdding) ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-8"
          >
            {/* Form Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-on-surface">{isAdding ? '新增菜品' : '编辑菜品'}</h2>
              <button onClick={() => { setEditingDish(null); setIsAdding(false); }} className="text-on-surface-variant/40 hover:text-on-surface transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {formError && (
              <div className="rounded-xl bg-error/10 px-4 py-3 text-xs font-bold text-error">
                {formError}
              </div>
            )}

            {/* Photo Upload Area (Mock) */}
            <div className="relative group">
              <div className="mx-auto aspect-square w-full max-w-sm bg-surface-container/30 rounded-2xl border-2 border-dashed border-outline-variant/30 flex items-center justify-center overflow-hidden transition-all group-hover:bg-white group-hover:border-primary/50 cursor-pointer custom-shadow">
                {formData.img ? (
                  <img src={formData.img} alt="preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="text-primary w-8 h-8" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">上传美味瞬间</span>
                  </div>
                )}
                {formData.img && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute right-3 top-3 z-20 rounded-xl bg-white/90 p-2 text-error shadow-lg backdrop-blur-md transition-all hover:bg-error hover:text-white active:scale-95"
                    aria-label="删除菜品图片"
                    title="删除图片"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {(isUploading || isSearchingImage) && (
                  <div className="absolute inset-0 bg-black/35 text-white flex items-center justify-center text-xs font-bold">
                    {isSearchingImage ? '搜索图片中...' : '上传中...'}
                  </div>
                )}
                <input className="absolute inset-0 z-10 opacity-0 cursor-pointer" type="file" accept="image/*" onChange={handlePhotoUpload} />
              </div>
            </div>

            {/* Input Fields */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">菜名</label>
                <div className="flex gap-2">
                  <input 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="h-12 min-w-0 flex-1 px-5 rounded-xl bg-white border border-outline-variant/20 focus:border-primary outline-none text-sm font-medium" 
                    placeholder="请输入菜品名称" 
                    type="text" 
                  />
                  <button
                    type="button"
                    onClick={handleSearchDishImage}
                    disabled={!formData.name.trim() || isSearchingImage || isUploading}
                    className="h-12 w-12 shrink-0 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:grayscale"
                    aria-label="根据菜名搜索图片"
                    title="搜索菜品图片"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">分类</label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: '荤菜', icon: <CookingPot className="w-4 h-4" /> },
                    { label: '素菜', icon: <Leaf className="w-4 h-4" /> },
                    { label: '汤羹', icon: <Soup className="w-4 h-4" /> },
                    { label: '主食', icon: <Utensils className="w-4 h-4" /> },
                  ].map((cat) => (
                    <button 
                      key={cat.label}
                      onClick={() => toggleTag(cat.label)}
                      className={`flex flex-col items-center justify-center py-3 rounded-xl transition-all border ${formData.tags.includes(cat.label) ? 'bg-primary text-white border-primary shadow-md' : 'bg-white border-outline-variant/10 text-on-surface-variant/40 hover:bg-surface-container-low'}`}
                    >
                      <div className="mb-1">{cat.icon}</div>
                      <span className="font-bold text-[8px] uppercase">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">故事与秘方</label>
                <textarea 
                  value={formData.desc}
                  onChange={e => setFormData({ ...formData, desc: e.target.value })}
                  className="w-full bg-white border border-outline-variant/20 rounded-xl p-4 text-sm font-medium text-on-surface outline-none min-h-[100px] resize-none" 
                  placeholder="这道菜背后有什么故事吗？" 
                  rows={3}
                />
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={isSaving || isUploading || isSearchingImage}
              className="w-full py-4 rounded-xl bg-primary text-white text-base font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              {isSaving ? '保存中...' : '保存这一道美味'}
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Search Input */}
            <div className="relative group">
              <input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-5 rounded-2xl bg-white border border-outline-variant/30 focus:border-primary/50 outline-none text-sm font-medium transition-all custom-shadow"
                placeholder="搜索菜品名称..."
                type="text"
              />
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-on-surface-variant/40 group-focus-within:text-primary transition-colors">
                <Utensils className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-4">
              {filteredDishes.length > 0 ? filteredDishes.map((dish, i) => (
                <motion.div 
                  key={dish.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-4 rounded-2xl custom-shadow flex items-center gap-4 bg-white/70 group"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-surface-container">
                    <img src={dish.img} alt={dish.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-on-surface text-base truncate">{dish.name}</h3>
                    <div className="flex gap-2 mt-1">
                      {dish.tags.map(tag => (
                        <span key={tag} className="text-[8px] font-black uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(dish)} className="p-2 bg-secondary-container text-primary rounded-lg hover:scale-110 active:scale-95 transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(dish.id)} className="p-2 bg-primary/5 text-primary rounded-lg hover:bg-error/10 hover:text-error hover:scale-110 active:scale-95 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )) : (
                <div className="text-center py-20 px-10 border-2 border-dashed border-outline-variant/20 rounded-3xl opacity-40">
                  <Utensils className="w-12 h-12 mx-auto mb-4 text-on-surface-variant" />
                  <p className="font-bold text-sm tracking-tight">
                    {searchQuery ? "没找到相关的菜肴哦" : "还没有任何菜品呢，快去新增一个吧！"}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
