import React, { useState } from 'react';
import { Link, useLocation, Routes, Route } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useScrollDirection } from '../../hooks/useScrollDirection'; // NEW HOOK

import PicksForm from '../picks/PicksForm';
import AdminForm from '../admin/AdminForm';
import Standings from '../standings/Standings';
import Profile from '../profile/Profile';
import Pools from '../pools/Pools';

import { SHOW_DATES } from '../../data/showDates.js';
import { getNextShow } from '../../utils/timeLogic.js';

export default function DashboardLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.email === 'pat@road2media.com';
  
  const scrollDirection = useScrollDirection(); // 'up' or 'down'

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

  // Helper to dynamically name the Context Bar based on URL
  const getPageTitle = () => {
    if (location.pathname === '/dashboard/standings') return 'Standings';
    if (location.pathname === '/dashboard/pools') return 'Your Pools';
    if (location.pathname === '/dashboard/profile') return 'Profile Settings';
    if (location.pathname === '/dashboard/admin') return 'War Room';
    return 'Make Your Picks';
  };

  return (
    <div className="flex h-screen w-full bg-[#0f172a] text-white overflow-hidden">
      
      {/* DESKTOP SIDEBAR (Unchanged) */}
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

      {/* MOBILE TOP HEADERS (Layers 1 & 2) */}
      <div className="md:hidden fixed top-0 left-0 w-full z-50">
        
        {/* Layer 1: Glassmorphism Brand Bar (Always Fixed) */}
        <div className="relative z-20 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4">
          <h1 className="text-lg font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            SETLIST PICK 'EM
          </h1>
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs">
            {user?.email?.charAt(0).toUpperCase() || '👤'}
          </div>
        </div>

        {/* Layer 2: Collapsible Context Title Bar */}
        <div 
          className={`absolute left-0 w-full bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between transition-transform duration-300 ease-in-out z-10 ${
            scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'
          }`}
        >
          <span className="font-bold text-slate-200">{getPageTitle()}</span>
          
          {/* We moved the Date Picker into the header for mobile! */}
          {location.pathname !== '/dashboard/profile' && (
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-900 border border-slate-600 text-white text-xs font-bold py-1.5 px-2 rounded-lg outline-none focus:border-emerald-500 transition-colors cursor-pointer max-w-[140px] truncate"
            >
              {SHOW_DATES.map(show => (
                <option key={show.date} value={show.date}>
                  {show.date} {show.venue.split(',')[0]}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA (Layer 3) */}
      {/* Note the pt-28 on mobile to push content below the headers, and pb-20 for bottom nav! */}
      <main className="flex-1 overflow-y-auto pt-32 pb-24 md:pt-8 md:pb-8 relative">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          
          {/* DESKTOP Global Date Picker (Hidden on Mobile) */}
          <div className="hidden md:flex mb-6 bg-slate-800/80 backdrop-blur-md p-3 rounded-2xl border border-slate-700 items-center justify-between shadow-lg">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Select Show:</span>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-900 border-2 border-slate-700 text-white text-base font-bold py-2.5 px-4 rounded-xl outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              {SHOW_DATES.map(show => (
                <option key={show.date} value={show.date}>
                  {show.date} — {show.venue.split(',')[0]}
                </option>
              ))}
            </select>
          </div>

          <Routes>
            <Route path="/" element={<PicksForm user={user} selectedDate={selectedDate} />} />
            <Route path="/standings" element={<Standings selectedDate={selectedDate} />} />
            <Route path="/admin" element={<AdminForm user={user} selectedDate={selectedDate} />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/pools" element={<Pools user={user} />} />
          </Routes>
        </div>
      </main>

      {/* MOBILE BOTTOM BAR (Layer 4) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 z-50 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            if (item.name === 'Admin') return null; // Hide admin from mobile bottom nav to save space
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