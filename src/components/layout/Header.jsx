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
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-[60] w-full shadow-2xl">
      <div className="max-w-4xl mx-auto flex flex-col gap-5">
        
        {/* TOP ROW: LOGO & PROFILE */}
        <div className="flex justify-between items-center px-1">
          <div className="flex flex-col">
            <h1 className="text-xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500 leading-none">
              PHISH POOL
            </h1>
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-[0.3em] mt-1 ml-0.5">
              {activePoolName || 'Global Pool'}
            </span>
          </div>
          
          <button 
            onClick={onOpenMenu}
            className="bg-slate-800 p-2.5 rounded-xl border border-slate-700 hover:bg-slate-700 transition-all active:scale-90 shadow-lg"
          >
            <span className="text-white text-xl leading-none">☰</span>
          </button>
        </div>

        {/* MIDDLE ROW: DATE PICKER */}
        <div className="flex justify-center items-center gap-4">
          <button 
            onClick={() => {
              const date = new Date(selectedDate);
              date.setDate(date.getDate() - 1);
              setSelectedDate(date.toISOString().split('T')[0]);
            }}
            className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white transition-colors text-xl"
          >
            ◀
          </button>
          
          <div className="relative flex items-center bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700 shadow-inner">
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white font-mono font-bold text-sm outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>

          <button 
            onClick={() => {
              const date = new Date(selectedDate);
              date.setDate(date.getDate() + 1);
              setSelectedDate(date.toISOString().split('T')[0]);
            }}
            className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white transition-colors text-xl"
          >
            ▶
          </button>
        </div>

        {/* BOTTOM ROW: THE "PREVIOUS STYLE" MENU (FIXED WIDTHS) */}
        <div className="w-full flex bg-slate-950/80 p-1 rounded-2xl border border-slate-800 shadow-2xl">
          <button 
            onClick={() => setActiveTab("picks")} 
            className={`flex-1 py-3 px-2 rounded-xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest transition-all duration-200 flex items-center justify-center ${
              activeTab === 'picks' 
              ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.15)] scale-[1.02]' 
              : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Picks
          </button>
          
          <button 
            onClick={() => setActiveTab("pools")} 
            className={`flex-1 py-3 px-2 rounded-xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest transition-all duration-200 flex items-center justify-center ${
              activeTab === 'pools' 
              ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.15)] scale-[1.02]' 
              : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Leaderboard
          </button>

          {isAdmin && (
            <button 
              onClick={() => setActiveTab("admin")} 
              className={`flex-1 py-3 px-2 rounded-xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest transition-all duration-200 flex items-center justify-center ${
                activeTab === 'admin' 
                ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.2)] scale-[1.02]' 
                : 'text-slate-500 hover:text-slate-300'
              }`}
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
