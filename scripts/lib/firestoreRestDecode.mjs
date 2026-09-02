/**
 * Re-export the shared Firestore REST decoder so prerender + Node tests
 * stay on one implementation (#869).
 */
export {
  decodeFirestoreRestDocument,
  decodeFirestoreRestValue,
  fetchFirestoreRestDocument,
} from '../../src/shared/lib/firestoreRestDecode.js';
