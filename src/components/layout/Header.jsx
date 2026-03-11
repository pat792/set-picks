import React from 'react';

const Header = ({ selectedDate, setSelectedDate, activeTab, onTabChange, onOpenMenu }) => {
  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-[60] px-6 py-4">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-xl font-black italic tracking-tighter text-white">PHISH POOL</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Global Pool</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* DATE PICKER - FIXED VISIBILITY */}
          <div className="relative group bg-slate-800 rounded-xl border border-white/10 px-3 py-2 flex items-center gap-2">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white text-xs font-bold outline-none [color-scheme:dark] cursor-pointer"
            />
          </div>
          
          <button 
            onClick={onOpenMenu} 
            className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center border border-white/10 transition-colors text-white"
          >
            <span className="text-xl">☰</span>
          </button>
        </div>
      </div>

      {/* THE ESSENTIAL THREE NAV */}
      <nav className="max-w-xl mx-auto mt-6">
        <div className="bg-slate-950/50 p-1 rounded-2xl flex gap-1 border border-white/5">
          {[
            { id: 'picks', label: 'Picks', color: 'bg-blue-600' },
            { id: 'pools', label: 'Pools', color: 'bg-indigo-600' },
            { id: 'leaderboard', label: 'Leaderboard', color: 'bg-white text-black' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? `${tab.color} shadow-lg scale-[1.02]` 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
};

export default Header;
