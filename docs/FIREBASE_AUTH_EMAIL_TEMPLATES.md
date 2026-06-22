# Firebase Auth Email Templates — Manual Configuration Runbook

Firebase Authentication sends several transactional emails automatically (password reset, email address verification, email change). These templates **must be customized in the Firebase Console** — they cannot be configured via code or the Firebase CLI.

## Why This Is Manual

Firebase Auth email templates are project-level settings stored in the Firebase backend. There is no Terraform/CLI path for the web-app email body or subject line. Branding updates require a human to open the Console and save the template.

Related issue: [#120 — Custom communications for in-app actions](https://github.com/your-org/set-picks/issues/120)

---

## Firebase Console Location

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project **`set-picks`**
3. Navigate to **Authentication → Templates** (left sidebar, under "Build")

You will see four template types:
- **Password reset**
- **Email address verification**
- **Email address change**
- **SMS verification** (not applicable — SMS not enabled)

---

## Templates to Customize

### 1. Password Reset

**Trigger:** User clicks "Forgot password?" on the splash screen or in Account Security settings.

| Field | Recommended value |
|-------|------------------|
| **Sender name** | `Setlist Pick 'Em` |
| **From address** | `noreply@set-picks.firebaseapp.com` (or custom domain — see below) |
| **Reply-to** | Leave empty or `support@<yourdomain>.com` |
| **Subject** | `Reset your Setlist Pick 'Em password` |
| **Message body** | See template text below |

**Suggested body:**

```
Hi,

We received a request to reset the password for your Setlist Pick 'Em account.

Click the link below to choose a new password. This link expires in 1 hour.

%LINK%

If you didn't request a password reset, you can ignore this email — your account is still secure.

— The Setlist Pick 'Em team
```

> `%LINK%` is a Firebase placeholder that gets replaced with the actual reset URL.

**Action URL:** By default this redirects to `set-picks.firebaseapp.com`. The app uses `handleCodeInApp: true` with `url: window.location.origin + '/password-reset-complete'`, so the link should deep-link back into the app. Verify this is set correctly under **"Action URL"** in the template editor — it should reflect the production domain (e.g., `https://setlistpickem.com/password-reset-complete`).

---

### 2. Email Address Verification

**Trigger:** After new account creation (if email verification is enabled).

| Field | Recommended value |
|-------|------------------|
| **Subject** | `Verify your Setlist Pick 'Em email` |

**Suggested body:**

```
Hi,

Welcome to Setlist Pick 'Em! Please verify your email address to complete your account setup.

%LINK%

If you didn't create this account, you can safely ignore this email.

— The Setlist Pick 'Em team
```

---

### 3. Email Address Change

**Trigger:** When a user changes their email in Account Security settings (revocation email sent to the old address).

| Field | Recommended value |
|-------|------------------|
| **Subject** | `Your Setlist Pick 'Em email address was changed` |

**Suggested body:**

```
Hi,

The email address for your Setlist Pick 'Em account was recently changed.

If you made this change, no further action is needed.

If you did not make this change, click the link below to revoke it and secure your account:

%LINK%

— The Setlist Pick 'Em team
```

---

## Custom Send Domain (Optional)

By default Firebase sends from `noreply@<project-id>.firebaseapp.com`. To send from a branded domain (e.g., `noreply@setlistpickem.com`):

1. In the Firebase Console, go to **Authentication → Templates → Edit** (top of page)
2. Click **"Customize domain"**
3. Add a verified sending domain and configure the required DNS records (SPF, DKIM, DMARC)
4. This requires ownership of the domain and access to DNS settings

> Note: Custom domains for Firebase Auth emails are distinct from the app's custom `authDomain` setting configured in `src/shared/lib/firebase.js` (that affects the OAuth redirect domain, not email sending).

---

## Logo / Branding

To add a logo to Auth emails:

1. In the Firebase Console, go to **Authentication → Templates**
2. Click the **pencil icon** next to "Customize Action URL" near the top
3. Under **"Customize"**, upload a logo image (PNG/JPG, recommended: 120×30 px on a transparent or white background)
4. The logo appears at the top of all Firebase Auth emails

---

## Verification Checklist (after updating templates)

- [ ] Trigger a password reset from the splash page and confirm the email arrives with correct sender name, subject, and body
- [ ] Confirm `%LINK%` deep-links back to `https://setlistpickem.com/password-reset-complete` (or staging equivalent) and not to `set-picks.firebaseapp.com`
- [ ] Check spam folder — SPF/DKIM records may need to be verified if using a custom domain
- [ ] Test on mobile email clients (Gmail app, Apple Mail) for rendering

---

## What Is NOT In Scope Here

The following require a separate transactional email provider (e.g., SendGrid) and backend Cloud Functions — deferred to a future sprint per issue #120:

- Branded HTML email for pick confirmation
- Post-show recap email
- Welcome email series
- Setlist lock reminder email

See [docs/IN_APP_ADS_EPIC.md](./IN_APP_ADS_EPIC.md) and the comms backlog for the full email roadmap.
