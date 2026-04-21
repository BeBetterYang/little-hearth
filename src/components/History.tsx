import { motion, AnimatePresence } from 'motion/react';
import { Search, Leaf, Calendar, X, Trash2 } from 'lucide-react';
import { Order } from '../types';
import React, { useState } from 'react';

interface HistoryProps {
  orders: Order[];
  onReorder: (order: Order) => void;
  onViewDetails: (order: Order) => void;
  onDelete: (order: Order) => void | Promise<void>;
}

function getOrderDateKey(order: Order) {
  if (order.dateKey) return order.dateKey;

  const match = order.date.match(/(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/);
  if (!match) return '';

  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export default function History({ orders, onReorder, onViewDetails, onDelete }: HistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDateQuery, setStartDateQuery] = useState('');
  const [endDateQuery, setEndDateQuery] = useState('');
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const hasDateRange = Boolean(startDateQuery || endDateQuery);

  const filteredOrders = orders.filter(order => {
    const matchesName = order.items.toLowerCase().includes(searchQuery.toLowerCase());
    const orderDateKey = getOrderDateKey(order);
    const matchesDate = !hasDateRange || (
      Boolean(orderDateKey) &&
      (!startDateQuery || orderDateKey >= startDateQuery) &&
      (!endDateQuery || orderDateKey <= endDateQuery)
    );

    return matchesName && matchesDate;
  });

  const clearDateFilter = () => {
    setStartDateQuery('');
    setEndDateQuery('');
  };

  const formatDateLabel = (date: string) => {
    if (!date) return '';
    return date.split('-').slice(1).join('/');
  };

  const getDateRangeLabel = () => {
    if (startDateQuery && endDateQuery) {
      return `${formatDateLabel(startDateQuery)}-${formatDateLabel(endDateQuery)}`;
    }

    if (startDateQuery) {
      return `${formatDateLabel(startDateQuery)} 起`;
    }

    if (endDateQuery) {
      return `至 ${formatDateLabel(endDateQuery)}`;
    }

    return '时间段';
  };

  const handleStartDateChange = (date: string) => {
    setStartDateQuery(date);
    if (date && endDateQuery && date > endDateQuery) {
      setEndDateQuery(date);
    }
  };

  const handleEndDateChange = (date: string) => {
    setEndDateQuery(date);
    if (date && startDateQuery && date < startDateQuery) {
      setStartDateQuery(date);
    }
  };

  const openDatePicker = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
    e.currentTarget.showPicker?.();
  };

  const confirmDelete = async () => {
    if (!orderToDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(orderToDelete);
      setOrderToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="pt-8 pb-32 px-6 space-y-5">
      {/* Title */}
      <section className="text-left py-2">
        <h2 className="text-3xl font-bold text-on-surface tracking-tight font-headline">美食足迹</h2>
        <p className="text-on-surface-variant/60 text-sm font-medium mt-1">那些温暖过胃里的 family 味道</p>
      </section>

      {/* Search / Filter Area */}
      <div>
        <div className="glass-card rounded-2xl p-3 flex flex-col gap-3 custom-shadow bg-white/70 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex-1 flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-2.5 border border-outline-variant/10">
            <Search className="text-on-surface-variant/40 w-4 h-4" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索历史中的美味..." 
              className="bg-transparent border-none focus:ring-0 p-0 text-sm font-medium w-full text-on-surface placeholder:text-on-surface-variant/30 outline-none"
            />
          </div>
          
          <div className="flex gap-2">
            <div className={`flex-1 rounded-xl border transition-all sm:flex-none ${hasDateRange ? 'border-primary/20 bg-primary text-white shadow-md shadow-primary/20' : 'border-outline-variant/10 bg-surface-container-low text-on-surface-variant/60'}`}>
              <div className="flex h-10 items-center gap-2 px-3">
                <Calendar className="w-4 h-4 shrink-0" />
                <div className="flex flex-1 items-center gap-2">
                  <label className="relative h-8 min-w-[4.5rem] cursor-pointer">
                    <input
                      type="date"
                      value={startDateQuery}
                      max={endDateQuery || undefined}
                      onClick={openDatePicker}
                      onChange={e => handleStartDateChange(e.target.value)}
                      className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                      aria-label="足迹筛选开始日期"
                    />
                    <span className="flex h-full items-center justify-center rounded-lg px-2 text-[10px] font-bold">
                      {startDateQuery ? formatDateLabel(startDateQuery) : '开始'}
                    </span>
                  </label>

                  <span className="text-[10px] font-bold opacity-60">至</span>

                  <label className="relative h-8 min-w-[4.5rem] cursor-pointer">
                    <input
                      type="date"
                      value={endDateQuery}
                      min={startDateQuery || undefined}
                      onClick={openDatePicker}
                      onChange={e => handleEndDateChange(e.target.value)}
                      className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                      aria-label="足迹筛选结束日期"
                    />
                    <span className="flex h-full items-center justify-center rounded-lg px-2 text-[10px] font-bold">
                      {endDateQuery ? formatDateLabel(endDateQuery) : '结束'}
                    </span>
                  </label>

                  <span className="hidden min-w-0 max-w-[7rem] truncate text-[10px] font-bold sm:block">
                    {getDateRangeLabel()}
                  </span>
                </div>
              </div>
            </div>
            {hasDateRange && (
              <button
                type="button"
                className="h-10 w-10 shrink-0 rounded-xl border border-outline-variant/10 bg-surface-container-low text-on-surface-variant/60 flex items-center justify-center transition-all hover:bg-surface-container-high active:scale-95"
                onClick={clearDateFilter}
                aria-label="清除日期筛选"
                title="清除时间筛选"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Order List */}
      <div className="space-y-4">
        {filteredOrders.length > 0 ? filteredOrders.map((order, i) => (
          <motion.div 
            key={order.id || `${order.date}-${i}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-2xl p-4 custom-shadow hover:border-primary/20 transition-all group border-none bg-white/70 relative"
          >
            <button
              type="button"
              onClick={() => setOrderToDelete(order)}
              className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-error/10 text-error flex items-center justify-center transition-all hover:bg-error hover:text-white active:scale-95"
              aria-label="删除足迹"
              title="删除足迹"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <div className="flex justify-between items-start mb-4">
              <div className="pr-10">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold mb-2 inline-block uppercase tracking-wider ${i === 0 ? 'bg-secondary-container text-on-secondary-container shadow-sm' : 'bg-surface-container-high text-on-surface-variant/60'}`}>
                  {order.status}
                </span>
                <p className="text-on-surface-variant/40 text-xs font-semibold">{order.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex -space-x-4">
                {order.images.map((img, idx) => (
                  <div 
                    key={idx}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-md ${idx === 0 ? 'rotate-[-2deg]' : 'rotate-[4deg] translate-y-1'}`}
                  >
                    <img alt="dish" className="w-full h-full object-cover" src={img} referrerPolicy="no-referrer" />
                  </div>
                ))}
                <div className="w-16 h-16 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant/40 font-bold text-xs border-2 border-white shadow-md">
                  +{order.extra}
                </div>
              </div>
              <div className="flex-1 min-w-0 pl-2">
                <h3 className="font-bold text-on-surface text-base mb-1 tracking-tight">{order.items}</h3>
                <p className="text-[11px] text-on-surface-variant/60 font-medium leading-relaxed italic">"{order.note}"</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => onReorder(order)}
                className="flex-1 py-2.5 px-5 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-98 transition-all"
              >
                再来一单
              </button>
              <button 
                onClick={() => onViewDetails(order)}
                className="px-5 py-2.5 bg-surface-container-low border border-outline-variant/10 text-on-surface-variant/70 rounded-xl font-bold text-xs hover:bg-surface-container-high active:scale-98 transition-all"
              >
                查看详情
              </button>
            </div>
          </motion.div>
        )) : (
          <div className="text-center py-20 opacity-20">
            <p className="font-bold text-sm">暂无匹配的足迹</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {orderToDelete && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/30 px-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-error/10 text-error">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface">删除这条足迹？</h3>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-on-surface-variant/60">
                    {orderToDelete.items} 的记录会被移除，已上传到这条足迹的本地图片也会一并清理。
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setOrderToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-xs font-bold text-on-surface-variant/70 transition-all hover:bg-surface-container-high disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl bg-error px-4 py-3 text-xs font-bold text-white shadow-lg shadow-error/20 transition-all hover:brightness-110 disabled:opacity-50"
                >
                  {isDeleting ? '删除中...' : '确认删除'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Decor */}
      <div className="mt-16 text-center">
        <div className="inline-block relative">
          <Leaf className="text-primary/10 w-8 h-8 mx-auto mb-2 opacity-40" />
          <div className="text-on-surface-variant/20 font-bold uppercase tracking-widest text-[10px]">
            End of Memories
          </div>
        </div>
      </div>
    </div>
  );
}
