import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { Copy, Loader2 } from 'lucide-react';

import { db } from '../../shared/lib/firebase';
import { SHOW_DATES } from '../../shared/data/showDates';
import Button from '../../shared/ui/Button';

function todayYmd() {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, '0');
  const d = String(n.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatShowLabel(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Prefer users where `pools` contains poolId; fall back to pool.members UIDs
 * so the hub works before user docs are backfilled with `pools`.
 */
async function fetchPoolMemberProfiles(poolId, memberUids) {
  let rows = [];
  try {
    const q = query(
      collection(db, 'users'),
      where('pools', 'array-contains', poolId)
    );
    const snap = await getDocs(q);
    rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('Pool hub: users pools query failed:', e);
  }

  if (rows.length === 0 && Array.isArray(memberUids) && memberUids.length > 0) {
    const snaps = await Promise.all(
      memberUids.map((uid) => getDoc(doc(db, 'users', uid)))
    );
    rows = snaps
      .filter((s) => s.exists())
      .map((s) => ({ id: s.id, ...s.data() }));
  }

  rows.sort(
    (a, b) =>
      (typeof b.totalPoints === 'number' ? b.totalPoints : 0) -
      (typeof a.totalPoints === 'number' ? a.totalPoints : 0)
  );
  return rows;
}

export default function PoolHubPage({ user }) {
  const { poolId } = useParams();
  const [pool, setPool] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteCode = pool?.inviteCode != null ? String(pool.inviteCode) : '';

  const pastShows = useMemo(() => {
    const today = todayYmd();
    return SHOW_DATES.filter((s) => s.date < today);
  }, []);

  const load = useCallback(async () => {
    if (!poolId?.trim()) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    setLoading(true);
    setNotFound(false);
    setForbidden(false);
    setPool(null);
    setMembers([]);

    try {
      const poolSnap = await getDoc(doc(db, 'pools', poolId));
      if (!poolSnap.exists()) {
        setNotFound(true);
        return;
      }

      const poolData = { id: poolSnap.id, ...poolSnap.data() };
      setPool(poolData);

      if (user?.uid && !poolData.members?.includes(user.uid)) {
        setForbidden(true);
        return;
      }

      const profiles = await fetchPoolMemberProfiles(poolId, poolData.members);
      setMembers(profiles);
    } catch (e) {
      console.error('Pool hub load error:', e);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [poolId, user?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 mt-20 text-emerald-400">
        <Loader2 className="w-10 h-10 animate-spin" aria-hidden />
        <p className="font-bold">Loading pool…</p>
      </div>
    );
  }

  if (notFound || !pool) {
    return (
      <div className="max-w-xl mx-auto mt-8 text-center space-y-4">
        <p className="text-slate-300 font-bold">Pool not found.</p>
        <Link
          to="/dashboard/pools"
          className="inline-block text-emerald-400 font-black uppercase tracking-widest text-sm hover:text-emerald-300 hover:underline"
        >
          Back to pools
        </Link>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="max-w-xl mx-auto mt-8 text-center space-y-4">
        <p className="text-slate-300 font-bold">
          You are not a member of this pool.
        </p>
        <Link
          to="/dashboard/pools"
          className="inline-block text-emerald-400 font-black uppercase tracking-widest text-sm hover:text-emerald-300 hover:underline"
        >
          Back to pools
        </Link>
      </div>
    );
  }

  const memberCount = pool.members?.length ?? 0;

  return (
    <div className="max-w-xl mx-auto mt-4 pb-24 space-y-10">
      <header className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6 space-y-4">
        <div>
          <h1 className="font-display text-display-md font-bold text-white">
            {pool.name}
          </h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div className="bg-slate-900 px-4 py-3 rounded-2xl border border-slate-700">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
              Invite code
            </p>
            <span className="text-emerald-400 font-mono font-black tracking-[0.2em] text-xl">
              {inviteCode || '—'}
            </span>
          </div>
          <Button
            type="button"
            variant="text"
            onClick={handleCopyCode}
            disabled={!inviteCode}
            className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white font-black uppercase tracking-widest text-sm hover:bg-slate-700 disabled:opacity-40"
          >
            <Copy className="w-4 h-4" aria-hidden />
            {copied ? 'Copied!' : 'Copy code'}
          </Button>
        </div>
      </header>

      <section>
        <h2 className="font-display text-display-sm font-bold uppercase tracking-wide text-white mb-4 px-1">
          All-time leaderboard
        </h2>
        {members.length === 0 ? (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-8 text-center text-slate-500 font-bold">
            No members to show yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {members.map((m, index) => {
              const rank = index + 1;
              const handle = m.handle || 'Anonymous';
              const pts =
                typeof m.totalPoints === 'number' ? m.totalPoints : 0;
              const played =
                typeof m.showsPlayed === 'number' ? m.showsPlayed : 0;
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-slate-500 font-black tabular-nums w-8 shrink-0">
                      {rank}
                    </span>
                    <Link
                      to={`/user/${m.id}`}
                      className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline truncate"
                    >
                      {handle}
                    </Link>
                  </div>
                  <div className="flex items-center gap-6 shrink-0 text-right">
                    <div>
                      <p className="font-black text-emerald-400 text-lg tabular-nums leading-none">
                        {pts}
                      </p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        pts
                      </p>
                    </div>
                    <div>
                      <p className="font-black text-white text-lg tabular-nums leading-none">
                        {played}
                      </p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        shows
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-display-sm font-bold uppercase tracking-wide text-white mb-4 px-1">
          Show archive
        </h2>
        <ul className="space-y-2">
          {pastShows.map((show) => (
            <li key={show.date}>
              <Link
                to={`/dashboard/standings?showDate=${encodeURIComponent(show.date)}&poolId=${encodeURIComponent(poolId)}`}
                className="block bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                View Standings for {formatShowLabel(show.date)}
              </Link>
            </li>
          ))}
        </ul>
        {pastShows.length === 0 && (
          <p className="text-slate-500 font-bold text-sm px-1">
            No past shows in the schedule yet.
          </p>
        )}
      </section>
    </div>
  );
}
