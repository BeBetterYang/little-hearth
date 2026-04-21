import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Calendar, Clock } from 'lucide-react';
import { Order, Dish } from '../types';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  allDishes: Dish[];
}

export default function OrderDetailsModal({ order, onClose, allDishes }: OrderDetailsModalProps) {
  if (!order) return null;

  const orderDishes = allDishes.filter(d => order.dishIds?.includes(d.id));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-lg bg-surface-container-lowest rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl safe-p-bottom h-fit max-h-[85vh] sm:max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-outline-variant/10">
            <h2 className="text-xl font-bold text-on-surface">订单详情</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-surface-container-high rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-on-surface-variant" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
            {/* Meta Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-on-surface-variant">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">订单日期</p>
                  <p className="font-bold text-sm text-on-surface">{order.date}</p>
                </div>
              </div>
            </div>

            {/* User Note & Gallery Section */}
            <div className="space-y-4">
              <div className="p-5 rounded-[24px] bg-surface-container-high border border-outline-variant/10 shadow-inner">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 mb-3">这一餐的记忆</p>
                <p className="text-base text-on-surface leading-relaxed font-medium">
                  {order.note || "没有留下文字备注哦~"}
                </p>
              </div>

              {order.images && order.images.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 px-1">生活碎片</p>
                  <div className="grid grid-cols-2 gap-3">
                    {order.images.map((img, idx) => (
                      <div 
                        key={idx} 
                        className={`aspect-square rounded-2xl overflow-hidden shadow-sm bg-surface-container ${order.images.length === 1 ? 'col-span-2 aspect-video' : ''}`}
                      >
                        <img 
                          src={img} 
                          alt="memo" 
                          className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dish List */}
            <div className="space-y-4 pb-12">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-on-surface tracking-tight">菜品清单</h3>
                <span className="px-3 py-1 bg-surface-container-high rounded-lg text-[10px] font-bold text-on-surface-variant/60">
                  共 {orderDishes.length} 件
                </span>
              </div>

              <div className="space-y-3">
                {orderDishes.map((dish) => (
                  <motion.div 
                    key={dish.id}
                    className="flex gap-4 p-3 rounded-2xl bg-white/50 border border-outline-variant/5 shadow-sm"
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-container shrink-0">
                      <img 
                        src={dish.img} 
                        alt={dish.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-center py-1">
                      <h4 className="font-bold text-on-surface text-base">{dish.name}</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {dish.tags.map(tag => (
                          <span key={tag} className="text-[9px] font-bold text-primary px-1.5 py-0.5 rounded-md bg-primary/5 border border-primary/10">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-on-surface-variant/70 mt-2 line-clamp-1">{dish.desc}</p>
                    </div>
                  </motion.div>
                ))}

                {orderDishes.length === 0 && (
                  <div className="py-10 text-center space-y-2 opacity-40">
                    <p className="text-sm font-bold">暂无菜品详细数据</p>
                    <p className="text-[10px] uppercase tracking-widest">这些菜品可能已被移出系统</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
