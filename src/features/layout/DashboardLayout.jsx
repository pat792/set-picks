import React from 'react';
import { Link, useLocation, Routes, Route } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

// 1. Importing your restored components!
import PicksForm from '../picks/PicksForm';
import AdminForm from '../admin/AdminForm';

export default function DashboardLayout() {
  const location = useLocation();
  const { user } = useAuth(); // Pulling user to check for Admin status

  // 2. Admin Check (Make sure this matches your actual email!)
  const isAdmin = user?.email === 'pat@road2media.com';

  // 3. Our core tabs
  const navItems = [
    { name: 'Picks', path: '/dashboard', icon: '📝' },
    { name: 'Pools', path: '/dashboard/pools', icon: '🌊' },
    { name: 'Standings', path: '/dashboard/standings', icon: '🏆' },
    { name: 'Profile', path: '/dashboard/profile', icon: '👤' },
  ];

  // 4. Dynamically add the Admin tab ONLY if the user is Pat
  if (isAdmin) {
    navItems.push({ name: 'Admin', path: '/dashboard/admin', icon: '⚙️' });
  }

  return (
    <div className="flex h-screen w-full bg-[#0f172a] text-white overflow-hidden">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <nav className="hidden md:flex flex-col w-64 bg-slate-800/50 border-r border-slate-700/50 p-4 z-10">
        <div className="mb-8 px-4 py-2">
          <h1 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            SETLIST PICK 'EM
          </h1>
        </div>
        
        <div className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            // Need to exact match '/dashboard' for Picks so it doesn't highlight on every page
            const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/dashboard/');
            return (
              <Link 
                key={item.name} 
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8 relative">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <Routes>
            {/* The Restored Core Forms */}
            <Route path="/" element={<PicksForm />} />
            <Route path="/admin" element={<AdminForm />} />

            {/* The Pages We Are Building Next */}
            <Route path="/pools" element={<h2 className="text-3xl font-bold mt-10 text-center">Pools Page (Coming Soon)</h2>} />
            <Route path="/standings" element={<h2 className="text-3xl font-bold mt-10 text-center">Standings Page (Coming Soon)</h2>} />
            <Route path="/profile" element={<h2 className="text-3xl font-bold mt-10 text-center">Profile Page (Coming Soon)</h2>} />
          </Routes>
        </div>
      </main>

      {/* --- MOBILE BOTTOM BAR --- */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 pb-safe z-50">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/dashboard/');
            return (
              <Link 
                key={item.name} 
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
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