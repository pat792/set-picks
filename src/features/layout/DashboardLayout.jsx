import React, { useState } from 'react';
import { Link, useLocation, Routes, Route } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

import PicksForm from '../picks/PicksForm';
import AdminForm from '../admin/AdminForm';
import Standings from '../standings/Standings';
import Profile from '../profile/Profile';

// NEW: Import our Time Machine!
import { SHOW_DATES } from '../../data/showDates.js';
import { getNextShow } from '../../utils/timeLogic.js';

export default function DashboardLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.email === 'pat@road2media.com';

  // NEW: The Global State! It defaults to whatever the "Next Show" is.
  const [selectedDate, setSelectedDate] = useState(getNextShow().date);

  const navItems = [
    { name: 'Picks', path: '/dashboard', icon: '📝' },
    { name: 'Pools', path: '/dashboard/pools', icon: '🌊' },
    { name: 'Standings', path: '/dashboard/standings', icon: '🏆' },
    { name: 'Profile', path: '/dashboard/profile', icon: '👤' },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Admin', path: '/dashboard/admin', icon: '⚙️' });
  }

  return (
    <div className="flex h-screen w-full bg-[#0f172a] text-white overflow-hidden">
      
      {/* DESKTOP SIDEBAR */}
      <nav className="hidden md:flex flex-col w-64 bg-slate-800/50 border-r border-slate-700/50 p-4 z-10">
        <div className="mb-8 px-4 py-2">
          <h1 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            SETLIST PICK 'EM
          </h1>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/dashboard/');
            return (
              <Link key={item.name} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <span className="text-xl">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8 relative">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          
          {/* THE GLOBAL DATE PICKER (Hidden on Profile Page) */}
          {location.pathname !== '/dashboard/profile' && (
            <div className="mb-6 bg-slate-800/80 backdrop-blur-md p-3 rounded-2xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Select Show:</span>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-900 border-2 border-slate-700 text-white text-sm sm:text-base font-bold py-2.5 px-4 rounded-xl outline-none focus:border-emerald-500 transition-colors cursor-pointer w-full sm:w-auto"
              >
                {SHOW_DATES.map(show => {
                  return (
                    <option key={show.date} value={show.date}>
                      {show.date} — {show.venue.split(',')[0]}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <Routes>
            {/* We pass selectedDate down into the pages! */}
            <Route path="/" element={<PicksForm user={user} selectedDate={selectedDate} />} />
            <Route path="/standings" element={<Standings selectedDate={selectedDate} />} />
            <Route path="/admin" element={<AdminForm user={user} />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/pools" element={<div className="flex justify-center mt-32 text-slate-500 font-bold uppercase">Pools Loading...</div>} />
          </Routes>
        </div>
      </main>

      {/* MOBILE BOTTOM BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 pb-safe z-50">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/dashboard/');
            return (
              <Link key={item.name} to={item.path} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
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