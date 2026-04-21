import { motion, AnimatePresence } from 'motion/react';
import { Search, CheckCircle2, Circle } from 'lucide-react';
import { useState } from 'react';
import { Dish } from '../types';

interface ShopProps {
  dishes: Dish[];
  onConfirm: (selectedIds: string[]) => void;
  initialSelectedIds: string[];
}

export default function Shop({ dishes, onConfirm, initialSelectedIds }: ShopProps) {
  const categories = ["全部", "荤菜", "素菜", "汤羹", "主食"];
  const [activeCategory, setActiveCategory] = useState("全部");
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredDishes = dishes.filter(dish => {
    const matchesCategory = activeCategory === "全部" || dish.tags.includes(activeCategory);
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="px-6 pb-48 pt-5">
      {/* Search Section */}
      <section className="sticky top-0 z-30 -mx-6 space-y-3 bg-background/95 px-6 pb-3 pt-3 backdrop-blur-xl">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-primary">
            <Search className="w-4 h-4" />
          </div>
          <input 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white/90 backdrop-blur-sm border border-outline-variant/30 rounded-2xl py-3 pl-11 pr-5 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-4 focus:ring-primary/5 focus:border-primary/50 transition-all custom-shadow outline-none font-medium text-sm" 
            placeholder="寻找今日的温暖味道..." 
            type="text" 
          />
        </div>
        
        {/* Categories Scroll */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all text-[11px] uppercase tracking-wide ${
                activeCategory === cat 
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                : 'bg-white text-on-surface-variant/60 hover:bg-surface-container-low border border-outline-variant/20 hover:border-outline-variant/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Menu Grid - Standard 2 cols */}
      <section className="mt-4 grid grid-cols-2 gap-4 min-h-[400px] content-start">
        <AnimatePresence mode="popLayout">
          {filteredDishes.map((dish) => {
            const isSelected = selectedIds.includes(dish.id);
            return (
              <motion.div 
                key={dish.id} 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => toggleSelect(dish.id)}
                className={`glass-card rounded-2xl overflow-hidden p-3 group transition-all hover:bg-white custom-shadow border-2 bg-white/70 h-fit cursor-pointer ${isSelected ? 'border-primary shadow-lg shadow-primary/5 bg-white' : 'border-transparent'}`}
              >
                <div className="aspect-square rounded-xl overflow-hidden mb-3 relative shadow-sm bg-surface-container">
                  <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={dish.img} referrerPolicy="no-referrer" />
                  <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                    {dish.tags.map((tag, idx) => (
                      <div key={idx} className="bg-white/90 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold text-primary border border-primary/10 uppercase tracking-widest shadow-sm">
                        {tag}
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-2 right-2">
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-primary fill-white" />
                    ) : (
                      <Circle className="w-5 h-5 text-white/50" />
                    )}
                  </div>
                </div>
                <h3 className="font-bold text-[13px] text-on-surface truncate tracking-tight mb-2">{dish.name}</h3>
                <button 
                  className={`w-full py-2 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest ${isSelected ? 'bg-primary text-white' : 'bg-primary/5 text-primary hover:bg-primary/10'}`}
                >
                  {isSelected ? '已加入' : '加入菜单'}
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {filteredDishes.length === 0 && (
          <div className="col-span-2 py-20 text-center opacity-20">
            <p className="font-bold text-sm">咦，没有找到相关的美味...</p>
          </div>
        )}
      </section>

      {/* Floating Selection Summary Card */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-lg z-50 px-2"
          >
            <div className="bg-on-surface/90 backdrop-blur-xl text-white p-3 py-2 rounded-2xl flex items-center justify-between shadow-2xl border border-white/5">
              <div className="flex items-center gap-3 pl-2 text-white/90 font-medium text-sm">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-xs font-bold shadow-lg shadow-primary/20">
                  {selectedIds.length}
                </div>
                <span>已准备好享受美味了</span>
              </div>
              <button 
                onClick={() => onConfirm(selectedIds)}
                className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
              >
                选好了
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
