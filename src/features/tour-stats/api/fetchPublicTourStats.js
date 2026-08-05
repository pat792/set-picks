/**
 * Public aggregate reads for `/tour-stats` (#665 / #853).
 *
 * Firebase stays off the marketing critical path: App Check + Firestore SDK +
 * `db` load only when a fetch runs. No static `firebase/*` or `firebase.js`
 * imports — after #835 login deferral, static imports regressed cold-open TTI
 * when this page still lived on `app.html`.
 */

/**
 * @returns {Promise<{
 *   db: import('firebase/firestore').Firestore,
 *   doc: typeof import('firebase/firestore').doc,
 *   getDoc: typeof import('firebase/firestore').getDoc,
 *   getDocs: typeof import('firebase/firestore').getDocs,
 *   collection: typeof import('firebase/firestore').collection,
 *   query: typeof import('firebase/firestore').query,
 *   where: typeof import('firebase/firestore').where,
 * }>}
 */
async function readyPublicTourStatsFirestore() {
  const [{ ensureAppCheckNow }, { ensureFirebase }, firestore] =
    await Promise.all([
      import('../../../shared/lib/firebaseAppCheck.js'),
      import('../../../shared/lib/ensureFirebase.js'),
      import('firebase/firestore'),
    ]);
  await ensureAppCheckNow();
  const { db } = await ensureFirebase();
  return {
    db,
    doc: firestore.doc,
    getDoc: firestore.getDoc,
    getDocs: firestore.getDocs,
    collection: firestore.collection,
    query: firestore.query,
    where: firestore.where,
  };
}

/**
 * @typedef {{
 *   tourSlug: string,
 *   tourLabel: string,
 *   lastShowDate?: string | null,
 *   firstShowDate?: string | null,
 *   showCount?: number,
 * }} PublicTourIndexEntry
 */

/**
 * @returns {Promise<{
 *   tours: PublicTourIndexEntry[],
 *   defaultTourSlug: string,
 * }>}
 */
export async function fetchPublicTourStatsIndex() {
  const { db, doc, getDoc } = await readyPublicTourStatsFirestore();
  const snap = await getDoc(doc(db, 'public_tour_stats', '_index'));
  if (!snap.exists()) {
    return { tours: [], defaultTourSlug: '' };
  }
  const data = snap.data() || {};
  const tours = Array.isArray(data.tours) ? data.tours : [];
  const defaultTourSlug =
    typeof data.defaultTourSlug === 'string' && data.defaultTourSlug
      ? data.defaultTourSlug
      : tours[0]?.tourSlug || '';
  return { tours, defaultTourSlug };
}

/**
 * @param {string} tourSlug
 * @returns {Promise<null | Record<string, unknown>>}
 */
export async function fetchPublicTourStatsDoc(tourSlug) {
  const slug = String(tourSlug ?? '').trim();
  if (!slug || slug.startsWith('_')) return null;
  const { db, doc, getDoc } = await readyPublicTourStatsFirestore();
  const snap = await getDoc(doc(db, 'public_tour_stats', slug));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Fallback if `_index` is missing: list non-index docs (bounded).
 * @returns {Promise<PublicTourIndexEntry[]>}
 */
export async function listPublicTourStatsDocs() {
  const { db, collection, getDocs, query, where } =
    await readyPublicTourStatsFirestore();
  // Accept both payload schema generations: 1 (pre-enrichment) and 2
  // (#666 phish.net enrichment). A hard `== 1` here silently emptied the
  // fallback once the refresh started writing schemaVersion 2.
  const q = query(
    collection(db, 'public_tour_stats'),
    where('schemaVersion', 'in', [1, 2]),
  );
  const snap = await getDocs(q);
  return snap.docs
    .filter((d) => d.id !== '_index')
    .map((d) => {
      const data = d.data() || {};
      return {
        tourSlug: d.id,
        tourLabel: typeof data.tourLabel === 'string' ? data.tourLabel : d.id,
        lastShowDate: data.lastShowDate ?? null,
        firstShowDate: data.firstShowDate ?? null,
        showCount: data.tourShowCount ?? data.showCount ?? null,
      };
    });
}
