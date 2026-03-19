# Setlist Pick 'em - Core User Flows

## Scenario 1: Organic First-Time User
*User discovers the site and wants to play.*
1. User lands on `/` (Splash Page).
2. User selects Authentication Method (Google, Apple, or Email/Password).
3. App authenticates via Firebase Auth (handling email verification if necessary).
4. App checks Firestore `users` collection.
5. **Condition:** No profile document found.
6. App routes user to `/setup` (Profile Setup).
7. User enters desired handle and submits.
8. App creates Firestore profile document.
9. App routes user to the main app layout.
10. User defaults to the **Picks** tab (Upcoming Show).

## Scenario 2: Joining a Private Pool (Link vs. Code)
*User joins a friend's private pool.*
* **Path A (The Link):**
    1. User clicks link: e.g., `/invite/pool_abc123`.
    2. App caches destination, forces Auth (if logged out), checks profile, and automatically adds user to the Pool.
* **Path B (The 6-Digit Code):**
    1. Authenticated user navigates to the **Pools** tab.
    2. User enters a 6-digit alphanumeric code (e.g., `YEM420`) into the "Join Pool" input.
    3. App queries Firestore for matching pool code.
    4. App adds user to that Private Pool.

## Scenario 3: Returning User (Standard Login)
*Existing user comes back to make picks.*
1. User lands on `/`.
2. User authenticates (Google/Apple/Email).
3. App checks Firestore.
4. **Condition:** Profile document IS found.
5. App bypasses `/setup` entirely.
6. App routes user directly to the **Picks** tab.

## Scenario 4: The Core Gameplay Loop (Making Picks)
*User locks in their predictions for the next show.*
1. User navigates to the **Picks** tab.
2. User utilizes the sub-navigation toggle: `[ Upcoming Show ] | [ Past Shows ]`.
3. **If Upcoming:** App displays the master prediction form for *only* the next scheduled show (driven by Phish.net API). 
4. User fills out the form and clicks "Lock In".
5. App saves the master pick sheet to the database (applying to all joined pools).
6. **If Past:** App displays read-only scorecards of previous shows the user participated in.

## Scenario 5: Authenticated User Creates a Private Pool
*Existing user wants to host their own room.*
1. User navigates to the **Pools** tab.
2. User clicks "Create Private Pool".
3. User names the pool and submits.
4. App creates pool document in Firestore.
5. App generates both a shareable invite link AND a unique 6-digit access code.

## Scenario 6: Global Admin Flow
*Site owner logs in to post actual setlist results.*
1. User logs in with designated admin email.
2. App recognizes email matches `ADMIN_EMAIL` constant.
3. Master navigation renders the hidden **Admin** tab.
4. User navigates to Admin tab to input live show results.