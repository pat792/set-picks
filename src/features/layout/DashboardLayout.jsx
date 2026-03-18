import React from 'react';
import { Link, useLocation, Routes, Route } from 'react-router-dom';

export default function DashboardLayout() {
  const location = useLocation();

  // Our 4 core tabs
  const navItems = [
    { name: 'Picks', path: '/dashboard', icon: '📝' },
    { name: 'Pools', path: '/dashboard/pools', icon: '🌊' },
    { name: 'Standings', path: '/dashboard/standings', icon: '🏆' },
    { name: 'Profile', path: '/dashboard/profile', icon: '👤' },
  ];

  return (
    <div className="flex h-screen w-full bg-[#0f172a] text-white overflow-hidden">
      
      {/* 1. DESKTOP SIDEBAR (Hidden on mobile, 64px wide on medium screens and up) */}
      <nav className="hidden md:flex flex-col w-64 bg-slate-800/50 border-r border-slate-700/50 p-4">
        <div className="mb-8 px-4 py-2">
          <h1 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            SETLIST PICK 'EM
          </h1>
        </div>
        
        <div className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.name} 
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 2. MAIN CONTENT AREA (Where your actual features will render) */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <Routes>
            <Route path="/" element={<h2 className="text-3xl font-bold">Picks Page (Coming Soon)</h2>} />
            <Route path="/pools" element={<h2 className="text-3xl font-bold">Pools Page (Coming Soon)</h2>} />
            <Route path="/standings" element={<h2 className="text-3xl font-bold">Standings Page (Coming Soon)</h2>} />
            <Route path="/profile" element={<h2 className="text-3xl font-bold">Profile Page (Coming Soon)</h2>} />
          </Routes>
        </div>
      </main>

      {/* 3. MOBILE BOTTOM BAR (Hidden on desktop, fixed to bottom on mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.name} 
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
}