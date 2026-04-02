# Phish Pool - Testing Protocols

## How to Test the "First-Time User" Experience
To prevent breaking the global admin account (pat@road2media.com) or messing up existing pool data, use a dedicated test email for all new-user flows.

**Designated Test Account:** `[Insert Your Personal/Test Email Here]`

### The Reset Protocol
Whenever you need to simulate a brand new user hitting the site for the very first time, follow these exact steps to scrub the test account from the database:

1. **Delete Auth Record:**
   - Go to the [Firebase Console](https://console.firebase.google.com/).
   - Navigate to **Authentication** -> **Users**.
   - Search for your test email.
   - Click the three dots (⋮) on the right and select **Delete account**.

2. **Delete Database Record:**
   - Navigate to **Firestore Database** -> **Data**.
   - Open the `users` collection.
   - Find the document that matches the UID of the deleted test account (or search by the test user's handle).
   - Click the three dots (⋮) next to the Document ID and select **Delete document**.

3. **Verify Clean Slate:**
   - Open a fresh **Incognito/Private Window** in your browser.
   - Navigate to the local testing URL (`http://localhost:5173`).
   - The app should treat you as a 100% unrecognized user.

## Firebase App Check (Local Dev)

- **Debug token:** `38422efd-029f-45b4-b028-7cf7fcaeeffc`
- Use this token in the Firebase Console App Check debug-token allowlist for local development.

