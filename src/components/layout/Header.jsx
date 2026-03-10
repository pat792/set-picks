import React from 'react';

const Header = ({ 
  selectedDate, 
  setSelectedDate, 
  activePoolName, 
  onOpenMenu, 
  activeTab, 
  setActiveTab, 
  isAdmin 
}) => {
  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-3 sticky top-0 z-[60] w-full shadow-xl">
      <div className="max-w-4xl mx-auto flex flex-col gap-3">
        {/* Top Row: Logo and Menu */}
        <div className="flex justify-between items-center px-1">
          <h1 className="text-lg font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
            PHISH POOL
          </h1>
          
          <div className="flex items-center gap-2">
            <div className="bg-blue-600/20 border border-blue-500/50 text-blue-400 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest hidden xs:block">
               {activePoolName || 'Global Pool'}
            </div>
            <button 
              onClick={onOpenMenu}
              className="bg-slate-800 p-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors"
            >
              <span className="text-white text-base leading-none">☰</span>
            </button>
          </div>
        </div>

        {/* Date Row */}
        <div className="flex justify-center items-center gap-3">
          <button 
            onClick={() => {
              const date = new Date(selectedDate);
              date.setDate(date.getDate() - 1);
              setSelectedDate(date.toISOString().split('T')[0]);
            }}
            className="text-slate-500 hover:text-white transition-colors px-2"
          >
            ◀
          </button>
          
          <div className="bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white font-mono font-bold text-xs outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>

          <button 
            onClick={() => {
              const date = new Date(selectedDate);
              date.setDate(date.getDate() + 1);
              setSelectedDate(date.toISOString().split('T')[0]);
            }}
            className="text-slate-500 hover:text-white transition-colors px-2"
          >
            ▶
          </button>
        </div>

        {/* Integrated Tab Switcher - Fixed Grid */}
        <div className={`grid ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'} gap-1 bg-slate-950/50 p-1 rounded-xl border border-slate-800`}>
          <button 
            onClick={() => setActiveTab("picks")} 
            className={`py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all truncate ${activeTab === 'picks' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}
          >
            Picks
          </button>
          <button 
            onClick={() => setActiveTab("pools")} 
            className={`py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all truncate ${activeTab === 'pools' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}
          >
            Leaderboard
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab("admin")} 
              className={`py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all truncate ${activeTab === 'admin' ? 'bg-emerald-600 text-black shadow-lg' : 'text-slate-500'}`}
            >
              Admin
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
