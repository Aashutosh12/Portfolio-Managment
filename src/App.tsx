import React, { useState } from 'react';
import { PortfolioProvider, usePortfolio } from './context/PortfolioContext';
import { OverviewTab } from './components/dashboard/OverviewTab';
import { StocksTab } from './components/modules/StocksTab';
import { CryptoTab } from './components/modules/CryptoTab';
import { MutualFundsTab } from './components/modules/MutualFundsTab';
import { BankingTab } from './components/modules/BankingTab';
import { SalaryTab } from './components/modules/SalaryTab';
import { GoalsTab } from './components/modules/GoalsTab';
import { ProjectionsTab } from './components/modules/ProjectionsTab';
import { VaultDebtTab } from './components/modules/VaultDebtTab';
import { CalculatorsTab } from './components/modules/CalculatorsTab';
import { ReportsTab } from './components/modules/ReportsTab';
import { SettingsTab } from './components/modules/SettingsTab';
import { LockScreen } from './components/dashboard/LockScreen';

import { 
  LayoutDashboard, 
  TrendingUp, 
  Coins, 
  Landmark, 
  Layers,
  Briefcase, 
  Target, 
  LineChart, 
  ShieldCheck, 
  Calculator, 
  FileText, 
  Settings as SettingsIcon,
  Lock,
  Bell,
  Menu,
  X,
  RefreshCw
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { data, locked, isLoading, lock, markNotificationRead, clearNotifications, refreshLivePrices } = usePortfolio();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-mono text-xs gap-3">
        <div className="relative flex h-10 w-10 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-600 opacity-75"></span>
          <span className="relative inline-flex rounded-xl h-6 w-6 bg-violet-550"></span>
        </div>
        <span>DECRYPTING SECURE ENVIRONMENT...</span>
      </div>
    );
  }

  // Gatekeeping lock check
  if (locked) {
    return <LockScreen />;
  }

  // Active Tab component router
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'stocks': return <StocksTab />;
      case 'crypto': return <CryptoTab />;
      case 'mutualfunds': return <MutualFundsTab />;
      case 'banking': return <BankingTab />;
      case 'salary': return <SalaryTab />;
      case 'goals': return <GoalsTab />;
      case 'projections': return <ProjectionsTab />;
      case 'vault': return <VaultDebtTab />;
      case 'calculators': return <CalculatorsTab />;
      case 'reports': return <ReportsTab />;
      case 'settings': return <SettingsTab />;
      default: return <OverviewTab />;
    }
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'stocks', label: 'Equities (Stocks)', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'crypto', label: 'Cryptocurrency', icon: <Coins className="w-4 h-4" /> },
    { id: 'mutualfunds', label: 'Mutual Funds', icon: <Layers className="w-4 h-4" /> },
    { id: 'banking', label: 'Banking & FDs', icon: <Landmark className="w-4 h-4" /> },
    { id: 'salary', label: 'Income & Budget', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'goals', label: 'Milestones & Goals', icon: <Target className="w-4 h-4" /> },
    { id: 'projections', label: 'Projections & FIRE', icon: <LineChart className="w-4 h-4" /> },
    { id: 'vault', label: 'Vault & Liabilities', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'calculators', label: 'Calculators', icon: <Calculator className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  // Count unread notifications
  const unreadNotifCount = data.notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased select-none">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <h1 className="text-sm font-black tracking-wider text-white uppercase bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
          ArthSetu Wealth
        </h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative p-1 text-slate-400">
            <Bell className="w-5 h-5" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1.5 -right-1 bg-violet-600 text-white font-mono text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                {unreadNotifCount}
              </span>
            )}
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1 text-slate-400">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* LEFT SIDEBAR (Hidden on mobile unless toggled) */}
      <aside className={`fixed md:relative inset-y-0 left-0 transform ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 w-64 bg-slate-900/60 backdrop-blur-md border-r border-slate-900 flex flex-col justify-between transition-transform duration-250 ease-in-out z-40 sticky top-0 h-screen`}>
        
        {/* Brand Banner */}
        <div className="p-6 pb-2">
          <h1 className="text-base font-black tracking-tight text-white uppercase bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent flex items-center gap-2">
            <span>ArthSetu</span> 
            <span className="text-[9px] border border-violet-500/30 text-violet-400 px-1.5 py-0.5 rounded font-mono font-normal tracking-wide uppercase">
              v1.0
            </span>
          </h1>
          <p className="text-[10px] text-slate-500 font-mono tracking-wide uppercase mt-1">Local-First Wealth vault</p>
        </div>

        {/* Navigation list */}
        <nav className="flex-grow py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === item.id 
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-650/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-850 space-y-3">
          <div className="flex items-center justify-between text-xs p-2 bg-slate-950/40 rounded-xl border border-slate-850">
            <span className="font-mono text-[9px] text-slate-500 font-bold uppercase tracking-wider">Active: {data.settings.currency}</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <button
            onClick={() => {
              if (confirm('Lock secure dashboard session?')) {
                lock();
              }
            }}
            className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-350 text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" /> Lock Session
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-grow flex flex-col min-w-0 min-h-screen">
        {/* DESKTOP TOP HEADER */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-slate-950/60 backdrop-blur-md sticky top-0 border-b border-slate-900/40 z-20">
          <div>
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
              {navItems.find(n => n.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick alert notifications bell */}
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)} 
                className={`p-2 rounded-lg border transition-all ${
                  isNotifOpen ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-900/30 border-slate-850/60 text-slate-400 hover:text-white'
                }`}
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1.5 -right-1 bg-violet-600 text-white font-mono text-[8px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-bounce">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Slide Down notifications popover */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 glass-dark border border-slate-800 rounded-2xl p-4 shadow-xl z-50 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800/60 text-xs font-bold">
                    <span className="text-slate-300">SYSTEM NOTIFICATIONS</span>
                    <button onClick={clearNotifications} className="text-slate-500 hover:text-slate-300 text-[10px]">Wipe All</button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {data.notifications.length > 0 ? (
                      data.notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          onClick={() => markNotificationRead(notif.id)}
                          className={`p-2.5 rounded-xl border text-[11px] leading-relaxed cursor-pointer transition-all ${
                            notif.read 
                              ? 'bg-slate-950/20 border-slate-900/40 text-slate-450' 
                              : 'bg-slate-900/60 border-slate-800/80 text-slate-200 hover:bg-slate-900'
                          }`}
                        >
                          <p>{notif.text}</p>
                          <span className="text-[9px] text-slate-500 font-mono block mt-1">{notif.date}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-[11px] text-slate-500 py-6">Your inbox is empty.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={async () => {
                if (isRefreshing) return;
                setIsRefreshing(true);
                try {
                  await refreshLivePrices();
                } catch (e) {
                  console.error(e);
                } finally {
                  setIsRefreshing(false);
                }
              }}
              disabled={isRefreshing}
              className="text-[10px] text-slate-350 hover:text-white border border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/60 py-1.5 px-3 rounded-xl font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              title="Pull latest stock and crypto prices from live APIs"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-violet-400' : 'text-slate-400'}`} />
              {isRefreshing ? 'Syncing...' : 'Sync Market'}
            </button>

            <div className="text-[10px] text-slate-500 border border-slate-900 bg-slate-900/30 py-1.5 px-3 rounded-lg font-mono uppercase tracking-wider">
              ✦ SECURED SANDBOX ENVIRONMENT ✦
            </div>
          </div>
        </header>

        {/* ACTIVE MODULE CONTAINER */}
        <div className="flex-grow p-4 md:p-8 overflow-y-auto">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <PortfolioProvider>
      <AppContent />
    </PortfolioProvider>
  );
}

export default App;
