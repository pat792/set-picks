# Phish Pool - Core User Flows

## Scenario 1: Organic First-Time User
*User discovers the site on their own and wants to join the public pool.*
1. User lands on `/` (Splash Page).
2. User clicks "Sign In With Google".
3. App authenticates via Firebase Auth.
4. App checks Firestore `users` collection.
5. **Condition:** No profile document found.
6. App routes user to `/setup` (Profile Setup).
7. User enters desired handle and submits.
8. App creates Firestore profile document.
9. App routes user to `/dashboard`.
10. User is automatically placed in the Global Pool view.

## Scenario 2: First-Time User via Invite Link
*User receives a link to a private pool from a friend.*
1. User clicks link: e.g., `/invite/pool_abc123`.
2. App detects user is not authenticated.
3. App caches the intended destination (`pool_abc123`) in local storage/session state.
4. App routes user to `/` to authenticate via Google.
5. App checks Firestore; no profile found.
6. App routes user to `/setup` (Profile Setup).
7. User creates handle.
8. App creates Firestore profile document.
9. App retrieves cached invite destination.
10. App adds user to the specific Private Pool.
11. App routes user to `/dashboard`, defaulting to that Private Pool tab.

## Scenario 3: Returning User (Standard Login)
*Existing user comes back to make picks.*
1. User lands on `/`.
2. User clicks "Sign In With Google".
3. App authenticates and checks Firestore.
4. **Condition:** Profile document IS found.
5. App bypasses `/setup` entirely.
6. App routes user directly to `/dashboard`.

## Scenario 4: Authenticated User Creates a Private Pool
*Existing user wants to host their own room.*
1. User is on `/dashboard` and navigates to the "Pools" tab.
2. User clicks "Create Private Pool".
3. User names the pool and submits.
4. App creates pool document in Firestore (assigning user as Admin of that pool).
5. App generates a unique shareable invite link.
6. User copies link to send to friends (which triggers Scenario 2 for them).

## Scenario 5: Global Admin Flow
*Site owner logs in to post actual setlist results.*
1. User logs in with `pat@road2media.com`.
2. App recognizes email matches `ADMIN_EMAIL` constant.
3. Sidebar renders the "Admin Control" button.
4. User navigates to Admin tab to input live show results.