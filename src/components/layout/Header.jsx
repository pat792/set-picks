import React from 'react';

const Header = ({ selectedDate, setSelectedDate, activeTab, onTabChange, onOpenMenu }) => {
  return (
    <header className="bg-[#0f172a] border-b border-white/10 sticky top-0 z-[60] px-6 py-4 text-white">
      {/* Top Row: Logo, Date, and Menu Toggle */}
      <div className="max-w-xl mx-auto flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-xl font-black italic tracking-tighter uppercase">PHISH POOL</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Global Pool</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800 rounded-xl border border-white/10 px-3 py-2 flex items-center">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white text-xs font-bold outline-none [color-scheme:dark] cursor-pointer"
            />
          </div>
          
          <button 
            onClick={onOpenMenu} 
            className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center border border-white/10 transition-colors"
          >
            <span className="text-xl font-bold">☰</span>
          </button>
        </div>
      </div>

      {/* Navigation Row: Full Width of Content Card & Prominent Tabs */}
      <div className="max-w-xl mx-auto mt-8">
        <nav className="bg-slate-900/50 p-1.5 rounded-2xl flex gap-1 border border-white/5 shadow-2xl">
          {[
            { id: 'picks', label: 'Picks' },
            { id: 'pools', label: 'Pools' },
            { id: 'leaderboard', label: 'Leaderboard' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-4 rounded-xl text-lg font-black uppercase tracking-tighter transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-xl scale-[1.02]' 
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
