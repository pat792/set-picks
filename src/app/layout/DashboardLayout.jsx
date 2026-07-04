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
import { ScoringRulesModalProvider } from '../../features/scoring';
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
  showOptionLabelDesktop,
  showOptionTitle,
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
import {
  dashboardTourDateLabelGradientClasses,
  dashboardTourDateSelectChromeDesktopWrap,
} from '../../shared/config/dashboardHeadingTypography';
import { getDashboardPageMeta } from './model/dashboardPageMeta';
import { usePrefetchDashboardRoutes } from './model/usePrefetchDashboardRoutes';
import DashboardMobileBrandBar from './ui/DashboardMobileBrandBar';
import DashboardMobileContextBar from './ui/DashboardMobileContextBar';
import DashboardPageHeading from './ui/DashboardPageHeading';

import { ListMusic, Users, Medal, User as UserIcon, Settings } from 'lucide-react';

// Primary nav tabs are static imports so tab switches never hit Suspense
// (lazy + single boundary unmounts the old route before the new chunk resolves).
// Secondary / deep routes stay lazy to keep the DashboardRoute chunk lean.
const AdminPage = lazy(dashboardLazyRouteImport.admin);
const AccountPage = lazy(dashboardLazyRouteImport.account);
const PoolHubPage = lazy(dashboardLazyRouteImport.poolHub);
const NotificationsPage = lazy(dashboardLazyRouteImport.notifications);

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
            const isActive =
              isProfileSection ||
              isPoolsSection ||
              (!isProfileSection &&
                !isPoolsSection &&
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

      {/* MOBILE TOP HEADERS — safe area + context bar anchored below brand (top-full) */}
      <div className="md:hidden fixed top-0 left-0 w-full z-50 pt-[env(safe-area-inset-top,0px)]">
        <div className="relative">
          <DashboardMobileBrandBar user={user} />
          <DashboardMobileContextBar
            scrollDirection={scrollDirection}
            contextTitle={meta.contextTitle}
            contextTitleTone={meta.desktopHeadingTone}
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
              <span
                className={`shrink-0 px-2 text-xs font-black uppercase tracking-widest ${dashboardTourDateLabelGradientClasses}`}
              >
                Tour Date:
              </span>
              <div className="min-w-0 w-64 max-w-full shrink">
                <div className={dashboardTourDateSelectChromeDesktopWrap}>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="show-date-select w-full min-w-0 max-w-full appearance-none rounded-[11px] border-0 bg-surface-field py-2.5 px-3 text-base font-bold text-white outline-none ring-0 transition-colors cursor-pointer focus:border-transparent focus:ring-0"
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
            </div>
          )}

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
            const isActive =
              isProfileSection ||
              isPoolsSection ||
              (!isProfileSection &&
                !isPoolsSection &&
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
