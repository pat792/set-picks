import React from 'react';

const Header = ({ selectedDate, setSelectedDate, activeTab, onTabChange, onOpenMenu }) => {
  return (
    <header className="bg-[#0f172a] border-b border-white/10 sticky top-0 z-[60] px-6 py-4 text-white">
      {/* Top Branding Row */}
      <div className="max-w-xl mx-auto flex items-center justify-between">
        <div className="flex flex-col">
          
          {/* LOGO AND TITLE ROW */}
          <div className="flex items-center gap-2">
            {/* The Red Donut */}
            <div className="w-5 h-5 rounded-full border-[4px] border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
            <h1 className="text-xl font-black italic tracking-tighter uppercase">PHISH POOL</h1>
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Global Pool</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-800 rounded-xl border border-white/10 px-3 py-2.5 flex items-center shadow-inner">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white text-sm font-bold outline-none [color-scheme:dark] cursor-pointer"
            />
          </div>
          
          <button 
            onClick={onOpenMenu} 
            className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center border border-white/10 transition-colors shadow-sm"
          >
            <span className="text-3xl font-black">☰</span>
          </button>
        </div>
      </div>

      {/* Navigation Row */}
      <div className="max-w-xl mx-auto mt-8 px-2">
        <nav className="bg-slate-900/80 p-1.5 rounded-2xl flex flex-row w-full border border-white/5 shadow-2xl">
          {[
            { id: 'picks', label: 'Picks' },
            { id: 'pools', label: 'Pools' },
            { id: 'leaderboard', label: 'Leaderboard' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-4 px-1 rounded-xl text-xs sm:text-sm font-black uppercase tracking-tight transition-all duration-200 text-center ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-xl' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
