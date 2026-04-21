import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Layout from './components/Layout';
import Home from './components/Home';
import Menu from './components/Menu';
import History from './components/History';
import Dishes from './components/Dishes';
import Shop from './components/Shop';
import OrderDetailsModal from './components/OrderDetailsModal';
import { Dish, HomeSettings, Order } from './types';
import {
  createDish,
  createOrder,
  deleteDish,
  deleteOrder,
  getAppData,
  updateDish,
  updateHomeSettings,
  updateTodayMenu,
} from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [todayMenuIds, setTodayMenuIds] = useState<string[]>([]);
  const [homeSettings, setHomeSettings] = useState<HomeSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    getAppData()
      .then((data) => {
        if (cancelled) return;
        setDishes(data.dishes);
        setHistoryOrders(data.orders);
        setTodayMenuIds(data.todayMenuIds);
        setHomeSettings(data.homeSettings);
      })
      .catch((error) => {
        if (!cancelled) setErrorMessage(error.message || '后端数据加载失败');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const persistTodayMenu = async (ids: string[]) => {
    const result = await updateTodayMenu(ids);
    setTodayMenuIds(result.todayMenuIds);
    return result.todayMenuIds;
  };

  const handleReorder = async (order: Order) => {
    if (order.dishIds) {
      try {
        await persistTodayMenu(order.dishIds);
        setActiveTab('menu');
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '菜单更新失败');
      }
    } else {
      setActiveTab('shop');
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrderForDetails(order);
  };

  const handleDeleteOrder = async (order: Order) => {
    if (!order.id) {
      setErrorMessage('这条足迹缺少编号，无法删除');
      return;
    }

    try {
      await deleteOrder(order.id);
      setHistoryOrders((prev) => prev.filter((item) => item.id !== order.id));
      if (selectedOrderForDetails?.id === order.id) {
        setSelectedOrderForDetails(null);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '足迹删除失败');
    }
  };

  const addOrderToHistory = async (order: Order) => {
    try {
      const savedOrder = await createOrder({ ...order, dishIds: todayMenuIds });
      setHistoryOrders((prev) => [savedOrder, ...prev]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '订单保存失败');
      throw error;
    }
  };

  const handleUpdateDish = async (updatedDish: Dish) => {
    try {
      const savedDish = await updateDish(updatedDish);
      setDishes((prev) => prev.map((dish) => (dish.id === savedDish.id ? savedDish : dish)));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '菜品保存失败');
      throw error;
    }
  };

  const handleAddDish = async (newDish: Dish) => {
    try {
      const savedDish = await createDish(newDish);
      setDishes((prev) => [...prev, savedDish]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '菜品新增失败');
      throw error;
    }
  };

  const handleDeleteDish = async (id: string) => {
    try {
      await deleteDish(id);
      setDishes((prev) => prev.filter((dish) => dish.id !== id));
      setTodayMenuIds((prev) => prev.filter((menuId) => menuId !== id));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '菜品删除失败');
    }
  };

  const handleToggleDishReady = async (id: string) => {
    const currentDish = dishes.find((dish) => dish.id === id);
    if (!currentDish) return;

    const updatedDish = { ...currentDish, ready: !currentDish.ready };
    setDishes((prev) => prev.map((dish) => (dish.id === id ? updatedDish : dish)));

    try {
      const savedDish = await updateDish(updatedDish);
      setDishes((prev) => prev.map((dish) => (dish.id === id ? savedDish : dish)));
    } catch (error) {
      setDishes((prev) => prev.map((dish) => (dish.id === id ? currentDish : dish)));
      setErrorMessage(error instanceof Error ? error.message : '菜品状态保存失败');
    }
  };

  const handleConfirmMenu = async (ids: string[]) => {
    try {
      await persistTodayMenu(ids);
      setActiveTab('menu');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '菜单保存失败');
    }
  };

  const handleUpdateHomeSettings = async (settings: HomeSettings) => {
    try {
      const savedSettings = await updateHomeSettings(settings);
      setHomeSettings(savedSettings);
      return savedSettings;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '首页设置保存失败');
      throw error;
    }
  };

  const menuDishes = useMemo(
    () => dishes.filter((dish) => todayMenuIds.includes(dish.id)),
    [dishes, todayMenuIds]
  );

  const renderTab = () => {
    switch (activeTab) {
      case 'home':
        return homeSettings ? <Home settings={homeSettings} onUpdateSettings={handleUpdateHomeSettings} onStartOrdering={() => setActiveTab('shop')} orders={historyOrders} onReorder={handleReorder} onViewDetails={handleViewDetails} /> : null;
      case 'shop':
        return <Shop dishes={dishes} onConfirm={handleConfirmMenu} initialSelectedIds={todayMenuIds} />;
      case 'menu':
        return <Menu dishes={menuDishes} onToggleReady={handleToggleDishReady} onComplete={addOrderToHistory} />;
      case 'history':
        return <History orders={historyOrders} onReorder={handleReorder} onViewDetails={handleViewDetails} onDelete={handleDeleteOrder} />;
      case 'dishes':
        return <Dishes dishes={dishes} onUpdate={handleUpdateDish} onAdd={handleAddDish} onDelete={handleDeleteDish} />;
      default:
        return homeSettings ? <Home settings={homeSettings} onUpdateSettings={handleUpdateHomeSettings} onStartOrdering={() => setActiveTab('shop')} orders={historyOrders} onReorder={handleReorder} onViewDetails={handleViewDetails} /> : null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-surface font-bold">
        正在准备家里的菜单...
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {errorMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-[calc(100%-2rem)] rounded-xl bg-error px-4 py-3 text-xs font-bold text-white shadow-xl">
          {errorMessage}
          <button className="ml-3 opacity-80" onClick={() => setErrorMessage('')}>关闭</button>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {renderTab()}
        </motion.div>
      </AnimatePresence>

      <OrderDetailsModal
        order={selectedOrderForDetails}
        onClose={() => setSelectedOrderForDetails(null)}
        allDishes={dishes}
      />
    </Layout>
  );
}
