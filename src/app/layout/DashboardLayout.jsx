import React, { useState } from 'react';
import { Link, useLocation, Routes, Route } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';
import { useScrollDirection } from '../../shared/hooks/useScrollDirection';

import { ListMusic, Users, Trophy, User as UserIcon, Settings } from 'lucide-react'; 

import PicksPage from '../../pages/picks/PicksPage';
import AdminPage from '../../pages/admin/AdminPage';
import StandingsPage from '../../pages/standings/StandingsPage';
import ProfilePage from '../../pages/profile/ProfilePage';
import AccountSecurity from '../../features/profile/AccountSecurity';
import PoolsPage from '../../pages/pools/PoolsPage';
import ScoringRulesPage from '../../pages/scoring/ScoringRulesPage';

import { SHOW_DATES_BY_TOUR } from '../../shared/data/showDates.js';
import { getNextShow, getShowStatus } from '../../shared/utils/timeLogic.js';
import { showOptionLabelDesktop, showOptionTitle } from '../../shared/utils/showOptionLabel.js';
import PastShowLockBanner from '../../features/picks/PastShowLockBanner';
import TooEarlyBanner from '../../features/picks/TooEarlyBanner';

import { getDashboardPageMeta } from './model/dashboardPageMeta';
import DashboardMobileBrandBar from './ui/DashboardMobileBrandBar';
import DashboardMobileContextBar from './ui/DashboardMobileContextBar';
import DashboardPageHeading from './ui/DashboardPageHeading';

export default function DashboardLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.email === 'pat@road2media.com';
  
  const scrollDirection = useScrollDirection(); 

  const [selectedDate, setSelectedDate] = useState(getNextShow().date);

    const navItems = [
    { name: 'Picks', path: '/dashboard', icon: ListMusic },
    { name: 'Pools', path: '/dashboard/pools', icon: Users },
    { name: 'Standings', path: '/dashboard/standings', icon: Trophy },
    { name: 'Profile', path: '/dashboard/profile', icon: UserIcon },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Admin', path: '/dashboard/admin', icon: Settings });
  }

  const meta = getDashboardPageMeta(location.pathname);
  const datePickerStatus = getShowStatus(selectedDate);
  const showDatePickerUserBanners = meta.showDatePicker && location.pathname !== '/dashboard/admin';
  const showPastShowLock = showDatePickerUserBanners && datePickerStatus === 'PAST';
  const showTooEarlyBanner = showDatePickerUserBanners && datePickerStatus === 'FUTURE';

  const isWarRoomRoute = meta.desktopHeadingTone === 'warRoom';

  return (
    <div className="flex h-screen w-full bg-[#0f172a] text-white overflow-hidden">
      
      {/* DESKTOP SIDEBAR */}
      <nav className="hidden md:flex flex-col w-64 bg-slate-800/50 border-r border-slate-700/50 p-4 z-10">
      <div className="mb-8 px-4 py-2">
          <h1 className="font-display text-display-brand-sidebar md:text-display-brand-sidebar-lg font-bold italic leading-none outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm hover:opacity-80 transition-opacity flex flex-col items-start">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500 pr-2">
              SETLIST
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500 pr-2">
              PICK 'EM
            </span>
          </h1>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon; // Extract the icon component
            const isProfileSection =
              item.path === '/dashboard/profile' &&
              (location.pathname === '/dashboard/profile' ||
                location.pathname === '/dashboard/account-security');
            const isActive =
              isProfileSection ||
              (!isProfileSection &&
                (location.pathname === item.path ||
                  (item.path === '/dashboard' && location.pathname === '/dashboard/')));
            return (
              <Link key={item.name} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                {/* Render the Lucide icon instead of text */}
                <Icon className="w-5 h-5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* MOBILE TOP HEADERS */}
      <div className="md:hidden fixed top-0 left-0 w-full z-50">
        <DashboardMobileBrandBar user={user} />
        <DashboardMobileContextBar
          scrollDirection={scrollDirection}
          contextTitle={meta.contextTitle}
          showDatePicker={meta.showDatePicker}
          selectedDate={selectedDate}
          onSelectedDateChange={setSelectedDate}
        />
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto pt-[8.75rem] pb-24 md:pt-8 md:pb-8 relative">
        <div className="max-w-xl mx-auto p-4 md:p-8">
          
          {/* DESKTOP Global Date Picker */}
          {meta.showDatePicker && (
            <div className="hidden md:flex mb-6 bg-slate-800/80 backdrop-blur-md p-3 rounded-2xl border border-slate-700 items-center justify-between gap-4 min-w-0 shadow-lg">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 shrink-0">Select Show:</span>
              <div className="min-w-0 w-64 max-w-full shrink">
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="show-date-select w-full min-w-0 max-w-full appearance-none bg-slate-900 border-2 border-slate-700 text-white text-base font-bold py-2.5 px-3 rounded-xl outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                >
                  {SHOW_DATES_BY_TOUR.map(({ tour, shows }) => (
                    <optgroup key={tour} label={tour} className="tour-optgroup">
                      {shows.map((show) => (
                        <option key={show.date} value={show.date} title={showOptionTitle(show)}>
                          {showOptionLabelDesktop(show)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          )}

          {showPastShowLock && <PastShowLockBanner />}
          {showTooEarlyBanner && <TooEarlyBanner />}

          {meta.layoutDesktopHeading && (
            <DashboardPageHeading title={meta.layoutDesktopHeading} tone={isWarRoomRoute ? 'warRoom' : 'default'} />
          )}

          <Routes>
            <Route path="/" element={<PicksPage user={user} selectedDate={selectedDate} />} />
            <Route path="/scoring" element={<ScoringRulesPage />} />
            <Route path="/standings" element={<StandingsPage selectedDate={selectedDate} />} />
            <Route path="/admin" element={<AdminPage user={user} selectedDate={selectedDate} />} />
            <Route path="/profile" element={<ProfilePage user={user} />} />
            <Route path="/account-security" element={<AccountSecurity user={user} />} />
            <Route path="/pools" element={<PoolsPage user={user} />} />
          </Routes>
        </div>
      </main>

      {/* MOBILE BOTTOM BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 z-50 pb-safe">
        <div className={`grid ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'} items-center h-16 px-2`}>
          {navItems.map((item) => {
            const Icon = item.icon; // Extract the icon component
            const isProfileSection =
              item.path === '/dashboard/profile' &&
              (location.pathname === '/dashboard/profile' ||
                location.pathname === '/dashboard/account-security');
            const isActive =
              isProfileSection ||
              (!isProfileSection &&
                (location.pathname === item.path ||
                  (item.path === '/dashboard' && location.pathname === '/dashboard/')));
            return (
              <Link key={item.name} to={item.path} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
                {/* Render the Lucide icon */}
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold tracking-wider">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
}