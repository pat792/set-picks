import React from 'react';

const Header = ({ selectedDate, setSelectedDate, activePoolName }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50 w-full">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        {/* Top Row: Logo and Pool Badge */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
            PHISH POOL
          </h1>
          
          <div className="bg-blue-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
             {activePoolName || 'Global Pool'}
          </div>
        </div>

        {/* Bottom Row: Date Picker Logic */}
        <div className="flex justify-center items-center gap-4">
          <button 
            onClick={() => {
              const date = new Date(selectedDate);
              date.setDate(date.getDate() - 1);
              setSelectedDate(date.toISOString().split('T')[0]);
            }}
            className="text-slate-400 hover:text-white"
          >
            ◀
          </button>
          <div className="font-mono font-bold text-white bg-slate-800 px-4 py-1 rounded-md border border-slate-700">
            {selectedDate}
          </div>
          <button 
            onClick={() => {
              const date = new Date(selectedDate);
              date.setDate(date.getDate() + 1);
              setSelectedDate(date.toISOString().split('T')[0]);
            }}
            className="text-slate-400 hover:text-white"
          >
            ▶
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
