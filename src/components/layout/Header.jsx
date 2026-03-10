import React from 'react';

const Header = ({ selectedDate, setSelectedDate, activePoolName, onOpenMenu }) => {
  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-[60] w-full shadow-xl">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        {/* Top Row: Logo and Menu */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
            PHISH POOL
          </h1>
          
          <div className="flex items-center gap-3">
            <div className="bg-blue-600/20 border border-blue-500/50 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest hidden sm:block">
               {activePoolName || 'Global Pool'}
            </div>
            <button 
              onClick={onOpenMenu}
              className="bg-slate-800 p-2 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors"
            >
              <span className="text-white text-lg leading-none">☰</span>
            </button>
          </div>
        </div>

        {/* Date Row */}
        <div className="flex justify-center items-center gap-2">
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
          
          <div className="relative flex items-center bg-slate-800 px-3 py-2 rounded-xl border border-slate-700 min-w-[160px] justify-center">
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white font-mono font-bold text-sm outline-none cursor-pointer scheme-dark"
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
      </div>
    </header>
  );
};

export default Header;
