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
    <header className="bg-[#0f172a] border-b border-slate-800 p-4 sticky top-0 z-[60] w-full shadow-2xl">
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        
        {/* TOP ROW: LOGO & MENU */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 leading-none">
              PHISH POOL
            </h1>
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] mt-1 ml-0.5">
              {activePoolName || 'Global Pool'}
            </span>
          </div>
          
          <button 
            onClick={onOpenMenu}
            className="bg-slate-800 p-2.5 rounded-xl border border-slate-700 hover:bg-slate-700 transition-all shadow-lg"
          >
            <span className="text-white text-xl leading-none">☰</span>
          </button>
        </div>

        {/* MIDDLE ROW: DATE PICKER */}
        <div className="flex justify-center items-center gap-6">
          <button 
            onClick={() => {
              const date = new Date(selectedDate);
              date.setDate(date.getDate() - 1);
              setSelectedDate(date.toISOString().split('T')[0]);
            }}
            className="text-slate-500 hover:text-white text-2xl p-2"
          >
            ◀
          </button>
          
          <div className="bg-slate-900 px-6 py-2.5 rounded-2xl border border-slate-700 shadow-inner flex items-center">
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white font-mono font-bold text-base outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>

          <button 
            onClick={() => {
              const date = new Date(selectedDate);
              date.setDate(date.getDate() + 1);
              setSelectedDate(date.toISOString().split('T')[0]);
            }}
            className="text-slate-500 hover:text-white text-2xl p-2"
          >
            ▶
          </button>
        </div>

        {/* BOTTOM ROW: CLEAN, CENTERED, BOLD TABS (NO ICONS) */}
        <div className="w-full flex bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 shadow-2xl">
          <button 
            onClick={() => setActiveTab("picks")} 
            className={`flex-1 py-4 rounded-xl font-black text-sm uppercase tracking-[0.15em] transition-all ${
              activeTab === 'picks' 
              ? 'bg-white text-black shadow-lg scale-[1.02]' 
              : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Picks
          </button>
          
          <button 
            onClick={() => setActiveTab("pools")} 
            className={`flex-1 py-4 rounded-xl font-black text-sm uppercase tracking-[0.15em] transition-all ${
              activeTab === 'pools' 
              ? 'bg-white text-black shadow-lg scale-[1.02]' 
              : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Leaderboard
          </button>

          {isAdmin && (
            <button 
              onClick={() => setActiveTab("admin")} 
              className={`flex-1 py-4 rounded-xl font-black text-sm uppercase tracking-[0.15em] transition-all ${
                activeTab === 'admin' 
                ? 'bg-emerald-400 text-black shadow-lg scale-[1.02]' 
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
