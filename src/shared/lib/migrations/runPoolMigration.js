import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';

import { db } from '../firebase';

export async function runPoolMigration() {
  console.log('[pool-migration] Starting legacy pool backfill...');

  try {
    const poolsSnap = await getDocs(collection(db, 'pools'));
    console.log(`[pool-migration] Found ${poolsSnap.size} pools.`);

    let attemptedUpdates = 0;
    let successfulUpdates = 0;
    let skippedUsers = 0;

    for (const poolDoc of poolsSnap.docs) {
      const poolId = poolDoc.id;
      const poolData = poolDoc.data();
      const members = Array.isArray(poolData.members) ? poolData.members : [];

      console.log(
        `[pool-migration] Processing pool ${poolId} with ${members.length} members.`
      );

      for (const uid of members) {
        attemptedUpdates += 1;
        try {
          await updateDoc(doc(db, 'users', uid), {
            pools: arrayUnion(poolId),
          });
          successfulUpdates += 1;
        } catch (error) {
          skippedUsers += 1;
          console.warn(
            `[pool-migration] Skipping user ${uid} for pool ${poolId}:`,
            error
          );
        }
      }
    }

    console.log(
      `[pool-migration] Done. attempted=${attemptedUpdates}, successful=${successfulUpdates}, skipped=${skippedUsers}`
    );
  } catch (error) {
    console.error('[pool-migration] Migration failed:', error);
  }
}
