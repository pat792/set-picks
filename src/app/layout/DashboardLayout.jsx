import React, { useState, useEffect } from 'react';
import { Link, Navigate, useLocation, Routes, Route, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { usePendingPoolJoin } from '../../features/pool-invite';
import { useShowCalendar } from '../../features/show-calendar';
import { useScrollDirection } from '../../shared/hooks/useScrollDirection';

import { ListMusic, Users, Medal, User as UserIcon, Settings } from 'lucide-react'; 

import PicksPage from '../../pages/picks/PicksPage';
import AdminPage from '../../pages/admin/AdminPage';
import StandingsPage from '../../pages/standings/StandingsPage';
import ProfilePage from '../../pages/profile/ProfilePage';
import { AccountSecurity } from '../../features/profile';
import PoolsPage from '../../pages/pools/PoolsPage';
import PoolHubPage from '../../pages/pools/PoolHubPage';

import { ScoringRulesModalProvider } from '../../features/scoring';
import {
  NAV_LABEL_ADMIN,
  NAV_LABEL_PICKS,
  NAV_LABEL_POOLS,
  NAV_LABEL_PROFILE,
  NAV_LABEL_STANDINGS,
} from '../../shared/config/dashboardVocabulary';
import { FALLBACK_SHOW_DATES } from '../../shared/data/showDates.js';
import { getNextShow, getShowBeforeDate, getShowStatus } from '../../shared/utils/timeLogic.js';
import {
  showOptionLabelCompact,
  showOptionLabelDesktop,
  showOptionTitle,
} from '../../shared/utils/showOptionLabel.js';
import { PastShowLockBanner, TooEarlyBanner } from '../../features/picks';

import { persistDashboardPath } from '../../shared/lib/dashboardLastPath';
import {
  BRAND_WORDMARK_SRC,
  brandWordmarkDashboardSidebarScaleWrapperClassNames,
  brandWordmarkImgClassNames,
} from '../../shared/config/branding';
import { getDashboardPageMeta } from './model/dashboardPageMeta';
import DashboardMobileBrandBar from './ui/DashboardMobileBrandBar';
import DashboardMobileContextBar from './ui/DashboardMobileContextBar';
import DashboardPageHeading from './ui/DashboardPageHeading';

export default function DashboardLayout() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isAdmin } = useAuth();
  const { showDates, showDatesByTour } = useShowCalendar();
  usePendingPoolJoin();
  
  const scrollDirection = useScrollDirection(); 

  const [selectedDate, setSelectedDate] = useState(() =>
    getNextShow(FALLBACK_SHOW_DATES).date
  );

  useEffect(() => {
    if (!showDates.length) return;
    setSelectedDate((prev) => {
      if (showDates.some((s) => s.date === prev)) return prev;
      return getNextShow(showDates).date;
    });
  }, [showDates]);

  const showDateFromStandingsUrl = searchParams.get('showDate');
  useEffect(() => {
    if (location.pathname !== '/dashboard/standings') return;
    if (!showDateFromStandingsUrl) return;
    const valid = showDates.some((s) => s.date === showDateFromStandingsUrl);
    if (valid) setSelectedDate(showDateFromStandingsUrl);
  }, [location.pathname, showDateFromStandingsUrl, showDates]);

  useEffect(() => {
    persistDashboardPath(location.pathname, location.search, {
      isAdminUser: isAdmin,
    });
  }, [location.pathname, location.search, isAdmin]);

    const navItems = [
    { name: NAV_LABEL_PICKS, path: '/dashboard', icon: ListMusic },
    { name: NAV_LABEL_POOLS, path: '/dashboard/pools', icon: Users },
    { name: NAV_LABEL_STANDINGS, path: '/dashboard/standings', icon: Medal },
    { name: NAV_LABEL_PROFILE, path: '/dashboard/profile', icon: UserIcon },
  ];

  if (isAdmin) {
    navItems.push({ name: NAV_LABEL_ADMIN, path: '/dashboard/admin', icon: Settings });
  }

  const meta = getDashboardPageMeta(location.pathname);
  const datePickerStatus = getShowStatus(selectedDate, showDates);
  const priorShowForTooEarly = getShowBeforeDate(selectedDate, showDates);
  const tooEarlyPriorLabel =
    priorShowForTooEarly != null ? showOptionLabelCompact(priorShowForTooEarly) : null;
  const showDatePickerUserBanners = meta.showDatePicker && location.pathname !== '/dashboard/admin';
  const showPastShowLock = showDatePickerUserBanners && datePickerStatus === 'PAST';
  const showTooEarlyBanner = showDatePickerUserBanners && datePickerStatus === 'FUTURE';

  const isWarRoomRoute = meta.desktopHeadingTone === 'warRoom';

  return (
    <ScoringRulesModalProvider>
    <div className="flex h-[100dvh] min-h-0 w-full bg-transparent text-white overflow-hidden md:h-screen">
      
      {/* DESKTOP SIDEBAR */}
      <nav className="hidden md:flex flex-col w-64 overflow-visible bg-surface-chrome border-r border-border-muted/65 p-4 z-10">
      <div className="mb-6 overflow-visible py-2">
          <h1 className="w-full overflow-visible text-center leading-none">
            <Link
              to="/dashboard"
              className="block w-full overflow-visible outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm hover:opacity-80 transition-opacity md:flex md:justify-center"
              aria-label="Setlist Pick 'Em — dashboard home"
            >
              <span className={brandWordmarkDashboardSidebarScaleWrapperClassNames}>
                <img
                  src={BRAND_WORDMARK_SRC}
                  alt=""
                  width={300}
                  height={120}
                  className={brandWordmarkImgClassNames.dashboardSidebar}
                  decoding="async"
                />
              </span>
            </Link>
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
              <Link key={item.name} to={item.path} className={`flex items-center gap-3 rounded-xl px-4 py-3 font-bold transition-all ${isActive ? 'bg-brand-primary/10 text-brand-primary' : 'text-content-secondary hover:bg-surface-inset hover:text-white'}`}>
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
            showDatesByTour={showDatesByTour}
          />
        </div>
      </div>

      {/* MAIN CONTENT AREA — mobile: match header stack + bottom nav + home indicator */}
      <main className="flex-1 min-w-0 overflow-y-auto pt-[calc(env(safe-area-inset-top,0px)+9rem)] pb-[calc(4rem+env(safe-area-inset-bottom,0px)+0.5rem)] md:pt-8 md:pb-8 relative">
        <div className="max-w-xl mx-auto w-full min-w-0 px-4 pt-2 md:p-8">
          
          {/* DESKTOP Global Date Picker */}
          {meta.showDatePicker && (
            <div className="hidden md:flex mb-6 bg-surface-panel-strong backdrop-blur-md p-3 rounded-2xl border border-border-muted/70 items-center justify-between gap-4 min-w-0 shadow-inset-glass ring-1 ring-border-glass/45">
              <span className="shrink-0 px-2 text-xs font-black uppercase tracking-widest text-content-secondary">
                Select Show:
              </span>
              <div className="min-w-0 w-64 max-w-full shrink">
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="show-date-select w-full min-w-0 max-w-full appearance-none bg-surface-field border-2 border-border-subtle text-white text-base font-bold py-2.5 px-3 rounded-xl outline-none focus:border-brand-primary transition-colors cursor-pointer"
                >
                  {showDatesByTour.map(({ tour, shows }, idx) => (
                    <optgroup
                      key={`${tour}-${shows[0]?.date ?? idx}`}
                      label={tour}
                      className="tour-optgroup"
                    >
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
          {showTooEarlyBanner && (
            <TooEarlyBanner priorShowLabel={tooEarlyPriorLabel} />
          )}

          {meta.layoutDetailEyebrow ? (
            <p className="mb-3 ml-1 hidden text-xs font-bold uppercase tracking-widest text-content-secondary md:block">
              {meta.layoutDetailEyebrow}
            </p>
          ) : null}

          {meta.layoutDesktopHeading && (
            <DashboardPageHeading title={meta.layoutDesktopHeading} tone={isWarRoomRoute ? 'warRoom' : 'default'} />
          )}

          <Routes>
            <Route index element={<PicksPage user={user} selectedDate={selectedDate} />} />
            <Route path="picks" element={<PicksPage user={user} selectedDate={selectedDate} />} />
            <Route
              path="scoring"
              element={<Navigate to="/dashboard?scoringRules=1" replace />}
            />
            <Route path="standings" element={<StandingsPage selectedDate={selectedDate} />} />
            <Route path="admin" element={<AdminPage user={user} selectedDate={selectedDate} />} />
            <Route path="profile" element={<ProfilePage user={user} />} />
            <Route path="account-security" element={<AccountSecurity user={user} />} />
            <Route path="pools" element={<PoolsPage user={user} />} />
            <Route path="pool/:poolId" element={<PoolHubPage user={user} />} />
          </Routes>
        </div>
      </main>

      {/* MOBILE BOTTOM BAR */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 w-full border-t border-border-subtle/35 bg-brand-bg/98 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-10px_28px_-14px_rgba(15,10,46,0.85)] backdrop-blur-sm supports-[backdrop-filter]:backdrop-saturate-125">
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
              <Link key={item.name} to={item.path} className={`flex h-full w-full flex-col items-center justify-center space-y-1 ${isActive ? 'text-brand-primary' : 'text-content-secondary hover:text-white'}`}>
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