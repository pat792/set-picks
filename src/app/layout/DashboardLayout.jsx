import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Link, Navigate, useLocation, Routes, Route, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { usePendingPoolJoin } from '../../features/pool-invite';
import { useShowCalendar } from '../../features/show-calendar';
import { useScrollDirection } from '../../shared/hooks/useScrollDirection';
import RouteSuspenseFallback from '../../shared/ui/RouteSuspenseFallback';
import {
  DASHBOARD_NAV_PRELOAD_BY_PATH,
  dashboardLazyRouteImport,
  prefetchDashboardRoutes,
} from './model/dashboardRouteModules';
import ProfileClusterLayout from './ui/ProfileClusterLayout';

import PicksPage from '../../pages/picks/PicksPage';
import PoolsPage from '../../pages/pools/PoolsPage';
import StandingsPage from '../../pages/standings/StandingsPage';
import ProfilePage from '../../pages/profile/ProfilePage';
import {
  ScoringRulesModalProvider,
  StandingsTourScopeSelect,
  useStandingsTourSelection,
} from '../../features/scoring';
import {
  NAV_LABEL_ADMIN,
  NAV_LABEL_PICKS,
  NAV_LABEL_POOLS,
  NAV_LABEL_PROFILE,
  NAV_LABEL_STANDINGS,
} from '../../shared/config/dashboardVocabulary';
import {
  PROFILE_CLUSTER_PATHS,
  isProfileClusterPath,
} from '../../shared/config/dashboardRoutes';
import { FALLBACK_SHOW_DATES } from '../../shared/data/showDates.js';
import { getNextShow, getShowBeforeDate, getShowStatus } from '../../shared/utils/timeLogic.js';
import {
  showOptionLabelCompact,
} from '../../shared/utils/showOptionLabel.js';
import { PastShowLockBanner, TooEarlyBanner, useSetlistLockToast } from '../../features/picks';
import { DashboardInstallEngageBanner } from '../../features/install';
import {
  CommsInboxProvider,
  DashboardNotificationsBell,
} from '../../features/notifications';
import { persistDashboardPath } from '../../shared/lib/dashboardLastPath';
import {
  BRAND_APP_CHROME_MARK_SRC,
  brandAppChromeMarkImgClassNames,
  brandWordmarkDashboardSidebarScaleWrapperClassNames,
} from '../../shared/config/branding';
import { getDashboardPageMeta } from './model/dashboardPageMeta';
import { usePrefetchDashboardRoutes } from './model/usePrefetchDashboardRoutes';
import DashboardMobileBrandBar from './ui/DashboardMobileBrandBar';
import DashboardMobileContextBar from './ui/DashboardMobileContextBar';
import DashboardPageHeading from './ui/DashboardPageHeading';
import DashboardTourDateScope from './ui/DashboardTourDateScope';
import { DASHBOARD_MOBILE_FIXED_CHROME_ROOT_ID } from '../../shared/hooks/useDashboardMobileChromePortal';

import { ListMusic, Users, Medal, User as UserIcon, Settings } from 'lucide-react';

// Primary nav tabs are static imports so tab switches never hit Suspense
// (lazy + single boundary unmounts the old route before the new chunk resolves).
// Secondary / deep routes stay lazy to keep the DashboardRoute chunk lean.
const AdminPage = lazy(dashboardLazyRouteImport.admin);
const AccountPage = lazy(dashboardLazyRouteImport.account);
const PoolHubPage = lazy(dashboardLazyRouteImport.poolHub);
const NotificationsPage = lazy(dashboardLazyRouteImport.notifications);
const TourStatsPage = lazy(dashboardLazyRouteImport.tourStats);

function LazyDashboardRoute({ children }) {
  return <Suspense fallback={<RouteSuspenseFallback />}>{children}</Suspense>;
}

function navPrefetchHandlers(path) {
  const keys = DASHBOARD_NAV_PRELOAD_BY_PATH[path];
  if (!keys?.length) return undefined;
  const warm = () => prefetchDashboardRoutes(keys);
  return {
    onMouseEnter: warm,
    onFocus: warm,
    onTouchStart: warm,
  };
}

export default function DashboardLayout() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isAdmin } = useAuth();
  const { showDates, showDatesByTour } = useShowCalendar();
  // URL-synced (`?tour=`) — same instance the Standings screen reads, so the
  // chrome tour picker and the tour leaderboard stay consistent (#295/#609).
  const { selectedTour, setTourKey, selectableTours } =
    useStandingsTourSelection(showDatesByTour);
  usePendingPoolJoin(showDates);
  usePrefetchDashboardRoutes(location.pathname);

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

  const meta = getDashboardPageMeta(location.pathname, location.search);
  const datePickerStatus = getShowStatus(selectedDate, showDates);
  useSetlistLockToast(datePickerStatus);
  const priorShowForTooEarly = getShowBeforeDate(selectedDate, showDates);
  const tooEarlyPriorLabel =
    priorShowForTooEarly != null ? showOptionLabelCompact(priorShowForTooEarly) : null;
  const showDatePickerUserBanners = meta.showDatePicker && location.pathname !== '/dashboard/admin';
  const showPastShowLock = showDatePickerUserBanners && datePickerStatus === 'PAST';
  const showTooEarlyBanner = showDatePickerUserBanners && datePickerStatus === 'FUTURE';

  const isWarRoomRoute = meta.desktopHeadingTone === 'warRoom';
  const isStandingsRoute =
    location.pathname === '/dashboard/standings' ||
    location.pathname === '/dashboard/standings/' ||
    location.pathname === '/dashboard/tour-stats' ||
    location.pathname === '/dashboard/tour-stats/';
  const isPicksRoute =
    location.pathname === '/dashboard' ||
    location.pathname === '/dashboard/' ||
    location.pathname === '/dashboard/picks' ||
    location.pathname === '/dashboard/picks/';
  const isPoolsListRoute =
    location.pathname === '/dashboard/pools' ||
    location.pathname === '/dashboard/pools/';
  const isProfileCluster = isProfileClusterPath(location.pathname);
  /** Primary tabs nest controls under the mobile context bar (Standings pattern). */
  const usesMobileFixedChrome =
    isStandingsRoute || isPicksRoute || isPoolsListRoute || isProfileCluster;

  return (
    <ScoringRulesModalProvider>
    <CommsInboxProvider userId={user?.uid}>
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
                  src={BRAND_APP_CHROME_MARK_SRC}
                  alt=""
                  width={128}
                  height={128}
                  className={brandAppChromeMarkImgClassNames.dashboardSidebar}
                  decoding="async"
                />
              </span>
            </Link>
          </h1>
        </div>
        <div className="mb-3 flex justify-end px-1">
          <DashboardNotificationsBell />
        </div>
        <div className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon; // Extract the icon component
            const isProfileSection =
              item.path === PROFILE_CLUSTER_PATHS.profile &&
              isProfileClusterPath(location.pathname);
            const isPoolsSection =
              item.path === '/dashboard/pools' &&
              (location.pathname === '/dashboard/pools' ||
                location.pathname.startsWith('/dashboard/pool/'));
            const isStandingsSection =
              item.path === '/dashboard/standings' &&
              (location.pathname === '/dashboard/standings' ||
                location.pathname === '/dashboard/standings/' ||
                location.pathname === '/dashboard/tour-stats' ||
                location.pathname === '/dashboard/tour-stats/');
            const isActive =
              isProfileSection ||
              isPoolsSection ||
              isStandingsSection ||
              (!isProfileSection &&
                !isPoolsSection &&
                !isStandingsSection &&
                (location.pathname === item.path ||
                  (item.path === '/dashboard' && location.pathname === '/dashboard/')));
            return (
              <Link
                key={item.name}
                to={item.path}
                {...navPrefetchHandlers(item.path)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 font-bold transition-all ${isActive ? 'bg-brand-primary/10 text-brand-primary' : 'text-content-secondary hover:bg-surface-inset hover:text-white'}`}
              >
                {/* Render the Lucide icon instead of text */}
                <Icon className="w-5 h-5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* MOBILE TOP HEADERS — safe area + context (+ page chrome) under brand */}
      <div className="md:hidden fixed top-0 left-0 w-full z-50 pt-[env(safe-area-inset-top,0px)]">
        <div className="relative">
          <DashboardMobileBrandBar user={user} />
          {/*
            Context + optional page chrome share one absolute stack under the
            brand bar so scroll-hide moves them together. Pages portal into
            #dashboard-mobile-fixed-chrome-root (Standings / Picks / Pools / Profile).
          */}
          <div
            className={`absolute top-full left-0 z-10 w-full transition-transform duration-300 ease-in-out ${
              scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'
            }`}
          >
            <DashboardMobileContextBar
              contextTitle={meta.contextTitle}
              contextTitleTone={meta.desktopHeadingTone}
              showDatePicker={meta.showDatePicker}
              selectedDate={selectedDate}
              onSelectedDateChange={setSelectedDate}
              showDates={showDates}
              showDatesByTour={showDatesByTour}
              tourScope={
                meta.isStandingsTourView
                  ? {
                      tours: selectableTours,
                      selectedTourKey: selectedTour?.tour ?? null,
                      onSelectTour: setTourKey,
                    }
                  : null
              }
            />
            {usesMobileFixedChrome ? (
              <div id={DASHBOARD_MOBILE_FIXED_CHROME_ROOT_ID} />
            ) : null}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT — routes with fixed chrome get extra top pad for the pills row */}
      <main
        className={[
          'flex-1 min-w-0 overflow-y-auto relative',
          'pb-[calc(4rem+env(safe-area-inset-bottom,0px)+0.5rem)] md:pt-8 md:pb-8',
          usesMobileFixedChrome
            ? 'pt-[calc(env(safe-area-inset-top,0px)+11.75rem)]'
            : 'pt-[calc(env(safe-area-inset-top,0px)+9rem)]',
        ].join(' ')}
      >
        <div className="max-w-xl mx-auto w-full min-w-0 px-4 pt-2 md:p-8">
          
          {/* DESKTOP Global Date Picker — sticky first chrome row on every route that shows it. */}
          {meta.showDatePicker ? (
            <div className="sticky top-0 z-30 -mx-4 mb-6 hidden bg-brand-bg/90 px-4 pb-3 pt-1 backdrop-blur-md supports-[backdrop-filter]:bg-brand-bg/75 md:-mx-8 md:block md:px-8">
              <DashboardTourDateScope
                variant="desktop"
                selectedDate={selectedDate}
                onSelectedDateChange={setSelectedDate}
                showDates={showDates}
                showDatesByTour={showDatesByTour}
              />
            </div>
          ) : null}

          {/* DESKTOP Tour scope — same sticky slot/treatment as Tour Date on the Standings Tour view. */}
          {meta.isStandingsTourView ? (
            <div className="sticky top-0 z-30 -mx-4 mb-6 hidden bg-brand-bg/90 px-4 pb-3 pt-1 backdrop-blur-md supports-[backdrop-filter]:bg-brand-bg/75 md:-mx-8 md:block md:px-8">
              <StandingsTourScopeSelect
                variant="desktop"
                tours={selectableTours}
                selectedTourKey={selectedTour?.tour ?? null}
                onSelectTour={setTourKey}
              />
            </div>
          ) : null}

          {showPastShowLock && <PastShowLockBanner />}
          {showTooEarlyBanner && (
            <TooEarlyBanner priorShowLabel={tooEarlyPriorLabel} />
          )}

          <DashboardInstallEngageBanner userId={user?.uid} pathname={location.pathname} />

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
            <Route
              path="picks"
              element={<PicksPage user={user} selectedDate={selectedDate} />}
            />
            <Route
              path="scoring"
              element={<Navigate to="/dashboard?scoringRules=1" replace />}
            />
            <Route
              path="standings"
              element={
                <StandingsPage
                  selectedDate={selectedDate}
                  onSelectShowDate={setSelectedDate}
                />
              }
            />
            <Route
              path="tour-stats"
              element={
                <LazyDashboardRoute>
                  <TourStatsPage />
                </LazyDashboardRoute>
              }
            />
            <Route
              path="admin"
              element={
                <LazyDashboardRoute>
                  <AdminPage user={user} selectedDate={selectedDate} />
                </LazyDashboardRoute>
              }
            />
            <Route path="profile" element={<ProfileClusterLayout user={user} />}>
              <Route index element={<ProfilePage />} />
              <Route
                path="notifications"
                element={
                  <LazyDashboardRoute>
                    <NotificationsPage />
                  </LazyDashboardRoute>
                }
              />
              <Route
                path="account"
                element={
                  <LazyDashboardRoute>
                    <AccountPage />
                  </LazyDashboardRoute>
                }
              />
            </Route>
            <Route
              path="account-security"
              element={
                <Navigate
                  to={`${PROFILE_CLUSTER_PATHS.account}${location.search}`}
                  replace
                />
              }
            />
            <Route
              path="notifications"
              element={
                <Navigate
                  to={`${PROFILE_CLUSTER_PATHS.notifications}${location.search}`}
                  replace
                />
              }
            />
            <Route path="pools" element={<PoolsPage user={user} />} />
            <Route
              path="pool/:poolId"
              element={
                <LazyDashboardRoute>
                  <PoolHubPage user={user} />
                </LazyDashboardRoute>
              }
            />
          </Routes>
        </div>
      </main>

      {/* MOBILE BOTTOM BAR — translucent tint + heavy blur (real glass); active pill keeps teal legible over scrolling content */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 w-full border-t border-border-subtle/35 bg-[linear-gradient(to_top,rgb(var(--brand-bg-deep)_/_0.76),rgb(var(--brand-bg)_/_0.60))] pb-[env(safe-area-inset-bottom,0px)] shadow-[inset_0_1px_0_0_rgb(var(--brand-primary)/0.12),0_-10px_28px_-14px_rgba(15,10,46,0.85)] ring-1 ring-inset ring-white/[0.06] backdrop-blur-xl supports-[backdrop-filter]:backdrop-blur-2xl supports-[backdrop-filter]:backdrop-saturate-150">
        <div className={`grid ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'} items-center gap-0.5 px-1.5 h-16`}>
          {navItems.map((item) => {
            const Icon = item.icon; // Extract the icon component
            const isProfileSection =
              item.path === PROFILE_CLUSTER_PATHS.profile &&
              isProfileClusterPath(location.pathname);
            const isPoolsSection =
              item.path === '/dashboard/pools' &&
              (location.pathname === '/dashboard/pools' ||
                location.pathname.startsWith('/dashboard/pool/'));
            const isStandingsSection =
              item.path === '/dashboard/standings' &&
              (location.pathname === '/dashboard/standings' ||
                location.pathname === '/dashboard/standings/' ||
                location.pathname === '/dashboard/tour-stats' ||
                location.pathname === '/dashboard/tour-stats/');
            const isActive =
              isProfileSection ||
              isPoolsSection ||
              isStandingsSection ||
              (!isProfileSection &&
                !isPoolsSection &&
                !isStandingsSection &&
                (location.pathname === item.path ||
                  (item.path === '/dashboard' && location.pathname === '/dashboard/')));
            return (
              <Link
                key={item.name}
                to={item.path}
                {...navPrefetchHandlers(item.path)}
                className={`flex h-[calc(100%-10px)] min-h-0 w-full flex-col items-center justify-center space-y-1 self-center rounded-xl transition-colors ${
                  isActive
                    ? 'text-brand-primary bg-brand-primary/[0.14] ring-1 ring-inset ring-brand-primary/30 shadow-[inset_0_1px_0_0_rgb(255_255_255_/_0.06)]'
                    : 'text-content-secondary hover:text-white'
                }`}
              >
                {/* Render the Lucide icon */}
                <Icon className="w-5 h-5 mb-0.5 drop-shadow-[0_1px_1px_rgb(15_10_46_/_0.75)]" />
                <span className="text-[10px] font-bold tracking-wider [text-shadow:0_1px_2px_rgb(15_10_46_/_0.88)]">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
    </CommsInboxProvider>
    </ScoringRulesModalProvider>
  );
}
