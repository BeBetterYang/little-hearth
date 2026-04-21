import React from 'react';
import { Bell, Home as HomeIcon, Utensils, History as HistoryIcon, PlusCircle, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const tabs = [
    { id: 'home', label: '首页', icon: HomeIcon },
    { id: 'shop', label: '点餐', icon: ShoppingBag },
    { id: 'menu', label: '菜单', icon: Utensils },
    { id: 'history', label: '足迹', icon: HistoryIcon },
    { id: 'dishes', label: '编辑', icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto">
        {children}
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex justify-around items-center px-2 py-2 bg-white/80 backdrop-blur-lg rounded-2xl custom-shadow border border-outline-variant/30 w-[95%] max-w-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center transition-all px-2.5 py-2 rounded-xl relative flex-1 ${
              activeTab === tab.id 
                ? 'text-primary' 
                : 'text-on-surface-variant/60 hover:text-on-surface'
            }`}
          >
            <tab.icon className={`w-5 h-5 mb-1 ${activeTab === tab.id ? 'fill-primary/10' : ''}`} />
            <span className="text-[9px] font-bold uppercase tracking-wider">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="tab-active"
                className="absolute inset-x-2 bottom-0 h-1 bg-primary rounded-t-full"
              />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
