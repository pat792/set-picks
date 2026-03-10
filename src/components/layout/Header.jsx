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
        
        {/* TOP ROW: LOGO & PROFILE */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 leading-none">
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
            className="text-slate-500 hover:text-white text-2xl"
          >
            ◀
          </button>
          
          <div className="bg-slate-900 px-6 py-2.5 rounded-2xl border border-slate-700 shadow-inner flex items-center">
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
            className="text-slate-500 hover:text-white text-2xl"
          >
            ▶
          </button>
        </div>

        {/* BOTTOM ROW: RESTORED "PERFECT" TAB SWITCHER */}
        <div className="w-full flex bg-slate-900/80 p-1.5 rounded-full border border-white/10 gap-1 shadow-2xl">
          <button 
            onClick={() => setActiveTab("picks")} 
            className={`flex-1 py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-all ${
              activeTab === 'picks' 
              ? 'bg-white text-black font-black shadow-lg scale-[1.02]' 
              : 'text-slate-400 hover:text-white font-bold'
            }`}
          >
            <span className="text-lg">🎟️</span>
            <span className="text-[10px] uppercase tracking-tighter">Picks</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("pools")} 
            className={`flex-1 py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-all ${
              activeTab === 'pools' 
              ? 'bg-white text-black font-black shadow-lg scale-[1.02]' 
              : 'text-slate-400 hover:text-white font-bold'
            }`}
          >
            <span className="text-lg">🤝</span>
            <span className="text-[10px] uppercase tracking-tighter">Pools</span>
          </button>

          {isAdmin && (
            <button 
              onClick={() => setActiveTab("admin")} 
              className={`flex-1 py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-all ${
                activeTab === 'admin' 
                ? 'bg-emerald-400 text-black font-black shadow-lg scale-[1.02]' 
                : 'text-slate-400 hover:text-white font-bold'
              }`}
            >
              <span className="text-lg">👑</span>
              <span className="text-[10px] uppercase tracking-tighter">Admin</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;
