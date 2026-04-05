import React, { useState, useEffect } from 'react';
import { Link, Navigate, useLocation, Routes, Route, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { usePendingPoolJoin } from '../../features/pool-invite';
import { useScrollDirection } from '../../shared/hooks/useScrollDirection';

import { ListMusic, Users, Trophy, User as UserIcon, Settings } from 'lucide-react'; 

import PicksPage from '../../pages/picks/PicksPage';
import AdminPage from '../../pages/admin/AdminPage';
import StandingsPage from '../../pages/standings/StandingsPage';
import ProfilePage from '../../pages/profile/ProfilePage';
import { AccountSecurity } from '../../features/profile';
import PoolsPage from '../../pages/pools/PoolsPage';
import PoolHubPage from '../../pages/pools/PoolHubPage';

import { ScoringRulesModalProvider } from '../../features/scoring';
import { NAV_LABEL_PICKS, NAV_LABEL_STANDINGS } from '../../shared/config/dashboardVocabulary';
import { SHOW_DATES, SHOW_DATES_BY_TOUR } from '../../shared/data/showDates.js';
import { getNextShow, getShowStatus } from '../../shared/utils/timeLogic.js';
import { showOptionLabelDesktop, showOptionTitle } from '../../shared/utils/showOptionLabel.js';
import { PastShowLockBanner, TooEarlyBanner } from '../../features/picks';

import { getDashboardPageMeta } from './model/dashboardPageMeta';
import DashboardMobileBrandBar from './ui/DashboardMobileBrandBar';
import DashboardMobileContextBar from './ui/DashboardMobileContextBar';
import DashboardPageHeading from './ui/DashboardPageHeading';

export default function DashboardLayout() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  usePendingPoolJoin();
  const isAdmin = user?.email === 'pat@road2media.com';
  
  const scrollDirection = useScrollDirection(); 

  const [selectedDate, setSelectedDate] = useState(getNextShow().date);

  const showDateFromStandingsUrl = searchParams.get('showDate');
  useEffect(() => {
    if (location.pathname !== '/dashboard/standings') return;
    if (!showDateFromStandingsUrl) return;
    const valid = SHOW_DATES.some((s) => s.date === showDateFromStandingsUrl);
    if (valid) setSelectedDate(showDateFromStandingsUrl);
  }, [location.pathname, showDateFromStandingsUrl]);

    const navItems = [
    { name: NAV_LABEL_PICKS, path: '/dashboard', icon: ListMusic },
    { name: 'Pools', path: '/dashboard/pools', icon: Users },
    { name: NAV_LABEL_STANDINGS, path: '/dashboard/standings', icon: Trophy },
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
    <ScoringRulesModalProvider>
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
            const isPoolsSection =
              item.path === '/dashboard/pools' &&
              (location.pathname === '/dashboard/pools' ||
                location.pathname.startsWith('/dashboard/pool/'));
            const isActive =
              isProfileSection ||
              isPoolsSection ||
              (!isProfileSection &&
                !isPoolsSection &&
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

      {/* MOBILE TOP HEADERS — safe area + context bar anchored below brand (top-full) */}
      <div className="md:hidden fixed top-0 left-0 w-full z-50 pt-[env(safe-area-inset-top,0px)]">
        <div className="relative">
          <DashboardMobileBrandBar user={user} />
          <DashboardMobileContextBar
            scrollDirection={scrollDirection}
            contextTitle={meta.contextTitle}
            showDatePicker={meta.showDatePicker}
            selectedDate={selectedDate}
            onSelectedDateChange={setSelectedDate}
          />
        </div>
      </div>

      {/* MAIN CONTENT AREA — mobile: match header stack + bottom nav + home indicator */}
      <main className="flex-1 overflow-y-auto pt-[calc(env(safe-area-inset-top,0px)+7.625rem)] pb-[calc(4rem+env(safe-area-inset-bottom,0px)+0.5rem)] md:pt-8 md:pb-8 relative">
        <div className="max-w-xl mx-auto px-4 pt-2 md:p-8">
          
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

          {meta.layoutDetailEyebrow ? (
            <p className="mb-3 ml-1 hidden text-xs font-bold uppercase tracking-widest text-slate-400 md:block">
              {meta.layoutDetailEyebrow}
            </p>
          ) : null}

          {meta.layoutDesktopHeading && (
            <DashboardPageHeading title={meta.layoutDesktopHeading} tone={isWarRoomRoute ? 'warRoom' : 'default'} />
          )}

          <Routes>
            <Route path="/" element={<PicksPage user={user} selectedDate={selectedDate} />} />
            <Route
              path="/scoring"
              element={<Navigate to="/dashboard?scoringRules=1" replace />}
            />
            <Route path="/standings" element={<StandingsPage selectedDate={selectedDate} />} />
            <Route path="/admin" element={<AdminPage user={user} selectedDate={selectedDate} />} />
            <Route path="/profile" element={<ProfilePage user={user} />} />
            <Route path="/account-security" element={<AccountSecurity user={user} />} />
            <Route path="/pools" element={<PoolsPage user={user} />} />
            <Route path="/pool/:poolId" element={<PoolHubPage user={user} />} />
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
            const isPoolsSection =
              item.path === '/dashboard/pools' &&
              (location.pathname === '/dashboard/pools' ||
                location.pathname.startsWith('/dashboard/pool/'));
            const isActive =
              isProfileSection ||
              isPoolsSection ||
              (!isProfileSection &&
                !isPoolsSection &&
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
    </ScoringRulesModalProvider>
  );
}