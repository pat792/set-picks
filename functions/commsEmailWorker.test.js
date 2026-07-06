"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createCommsEmailWorker,
  unsubscribeHeaders,
  buildResendClient,
  buildBrandedEmailHtml,
  buildProductionBrandedEmailShell,
  stripRedundantCtaLine,
  escapeHtml,
} = require("./commsEmailWorker");

function fakeResend(captured) {
  return {
    emails: {
      async send(message, options) {
        captured.push({ message, options });
        return { data: { id: "email_123" }, error: null };
      },
    },
  };
}

const baseCtx = {
  uid: "u1",
  userData: { email: "picker@example.com" },
  triggerId: "show_recap",
  rendered: { email: { subject: "Your recap", text: "Body" } },
  dedupId: "show_recap:u1:2026-07-18",
};

test("sends via Resend with idempotency key + unsubscribe headers", async () => {
  const captured = [];
  const worker = createCommsEmailWorker({
    resendClient: fakeResend(captured),
    unsubscribeSigningSecret: "test-secret",
  });
  const res = await worker(baseCtx);

  assert.equal(res.ok, true);
  assert.equal(res.id, "email_123");
  assert.equal(captured.length, 1);
  assert.deepEqual(captured[0].message.to, ["picker@example.com"]);
  assert.equal(captured[0].options.idempotencyKey, "show_recap/u1:show_recap:u1:2026-07-18");
  assert.match(captured[0].message.headers["List-Unsubscribe"], /commsEmailUnsubscribe/);
  assert.equal(captured[0].message.headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
});

test("idempotencyKey is stable (no forceResend) — production retries never double-send", async () => {
  const captured = [];
  const worker = createCommsEmailWorker({ resendClient: fakeResend(captured) });
  await worker(baseCtx);
  await worker(baseCtx);
  assert.equal(captured[0].options.idempotencyKey, captured[1].options.idempotencyKey);
});

test("forceResend varies the idempotencyKey so Resend doesn't reject a re-run with different content", async () => {
  const captured = [];
  const worker = createCommsEmailWorker({ resendClient: fakeResend(captured) });
  await worker({ ...baseCtx, forceResend: true });
  await worker({ ...baseCtx, forceResend: true });
  assert.notEqual(
    captured[0].options.idempotencyKey,
    captured[1].options.idempotencyKey,
    "each forceResend call must get a unique Resend idempotency key"
  );
  assert.match(captured[0].options.idempotencyKey, /^show_recap\/u1:show_recap:u1:2026-07-18:\d+:[a-z0-9]+$/);
});

test("dry run does not send", async () => {
  const captured = [];
  const worker = createCommsEmailWorker({ resendClient: fakeResend(captured) });
  const res = await worker({ ...baseCtx, dryRun: true });
  assert.equal(res.ok, true);
  assert.equal(res.skipReason, "dry_run");
  assert.equal(captured.length, 0);
});

test("skips when recipient has no email", async () => {
  const captured = [];
  const worker = createCommsEmailWorker({ resendClient: fakeResend(captured) });
  const res = await worker({ ...baseCtx, userData: {} });
  assert.equal(res.ok, false);
  assert.equal(res.skipReason, "no_email");
  assert.equal(captured.length, 0);
});

test("skips gracefully when no Resend client is configured", async () => {
  const worker = createCommsEmailWorker({ resendClient: null });
  const res = await worker(baseCtx);
  assert.equal(res.ok, false);
  assert.equal(res.skipReason, "no_email_provider");
});

test("reports send_error when Resend returns an error", async () => {
  const worker = createCommsEmailWorker({
    resendClient: {
      emails: {
        async send() {
          return { data: null, error: { message: "rate_limited" } };
        },
      },
    },
  });
  const res = await worker(baseCtx);
  assert.equal(res.ok, false);
  assert.equal(res.skipReason, "send_error");
});

test("buildResendClient returns null without an api key", () => {
  assert.equal(buildResendClient(""), null);
  assert.equal(buildResendClient(undefined), null);
});

test("skips when email is on suppression list", async () => {
  const { emailSuppressionDocId } = require("./commsEmailSuppression");
  const docId = emailSuppressionDocId("picker@example.com");
  const db = {
    collection(name) {
      return {
        doc(id) {
          return {
            async get() {
              if (name === "email_suppression" && id === docId) {
                return { exists: true, data: () => ({ suppressed: true }) };
              }
              return { exists: false, data: () => null };
            },
          };
        },
      };
    },
  };
  const captured = [];
  const worker = createCommsEmailWorker({ resendClient: fakeResend(captured), db });
  const res = await worker(baseCtx);
  assert.equal(res.ok, false);
  assert.equal(res.skipReason, "email_suppressed");
  assert.equal(captured.length, 0);
});

test("unsubscribeHeaders point at the notifications screen when unsigned", () => {
  const headers = unsubscribeHeaders("https://www.setlistpickem.com");
  assert.match(headers["List-Unsubscribe"], /\/dashboard\/profile\/notifications/);
});

test("sends branded shell with hosted wordmark URL (no MIME attachments)", async () => {
  const captured = [];
  const worker = createCommsEmailWorker({
    resendClient: fakeResend(captured),
    unsubscribeSigningSecret: "test-secret",
  });
  await worker(baseCtx);

  const { html, attachments } = captured[0].message;
  assert.match(html, /\/branding\/email-gradient-wordmark\.png/);
  assert.ok(!html.includes("cid:"));
  assert.ok(!html.includes("data:image"));
  assert.equal(attachments, undefined);
});

test("pre-rendered html does not attach service shell wordmark", async () => {
  const captured = [];
  const worker = createCommsEmailWorker({
    resendClient: fakeResend(captured),
    unsubscribeSigningSecret: "test-secret",
  });
  const customHtml = "<!DOCTYPE html><html><body><p>Marketing letter</p></body></html>";
  await worker({
    ...baseCtx,
    rendered: {
      email: {
        subject: "Summer Tour",
        text: "Plain fallback",
        html: customHtml,
        ctaUrl: "https://www.setlistpickem.com/dashboard/picks",
      },
    },
  });

  assert.equal(captured[0].message.html, customHtml);
  assert.doesNotMatch(captured[0].message.html, /web-app-manifest-512x512/);
  assert.equal(captured[0].message.attachments, undefined);
});

test("sends a branded HTML body alongside the plain-text fallback", async () => {
  const captured = [];
  const worker = createCommsEmailWorker({
    resendClient: fakeResend(captured),
    unsubscribeSigningSecret: "test-secret",
  });
  await worker(baseCtx);

  const { html, headers } = captured[0].message;
  assert.ok(html.includes("<!DOCTYPE html>"));
  assert.match(html, /\/branding\/email-gradient-wordmark\.png/, "references hosted wordmark in header");
  assert.match(html, /Manage preferences/);
  assert.match(html, /Unsubscribe/);
  assert.match(html, /\/dashboard\/profile\/notifications/, "visible footer link goes to the preferences page");
  // #456: the visible body link must be a safe GET (preferences page), never the
  // raw signed one-click suppression URL — that's reserved for the invisible
  // List-Unsubscribe header, which mail clients only ever invoke via POST.
  assert.ok(
    !html.includes("commsEmailUnsubscribe"),
    "visible body link must not be the one-click suppression endpoint"
  );
  assert.match(
    headers["List-Unsubscribe"],
    /commsEmailUnsubscribe/,
    "the true one-click action still lives in the header, for mail clients"
  );
});

test("stripRedundantCtaLine drops the plain-text 'Open the app' line", () => {
  const text = "Hi Pat!\n\nOpen the app: https://www.setlistpickem.com/dashboard\n\nSee you there.";
  assert.equal(
    stripRedundantCtaLine(text),
    "Hi Pat!\n\n\nSee you there."
  );
});

test("branded HTML body omits the redundant plain-text app link (button already covers it)", async () => {
  const captured = [];
  const worker = createCommsEmailWorker({
    resendClient: fakeResend(captured),
    unsubscribeSigningSecret: "test-secret",
  });
  const ctx = {
    ...baseCtx,
    rendered: {
      email: {
        subject: "Your recap",
        text: [
          "Hi Pat, here is your recap.",
          "",
          "Open the app: https://www.setlistpickem.com/dashboard",
          "",
          "See you on tour!",
        ].join("\n"),
        signOff: "See you on tour!",
      },
    },
  };
  await worker(ctx);

  const { html, text } = captured[0].message;
  assert.match(text, /Open the app: https:\/\/www\.setlistpickem\.com\/dashboard/);
  assert.ok(!html.includes("Open the app:"));
  assert.ok(!html.includes("Manage which updates"));
  assert.match(html, /See you on tour!/);
  assert.match(html, /\/branding\/email-gradient-wordmark\.png/, "gradient wordmark in header");
  assert.match(html, /Open Setlist Pick(?:&#39;|&apos;)em/, "the CTA button is still present");
});

test("formatWordmarkAttachmentForResendApi uses REST snake_case inline_content_id", () => {
  const { buildEmailWordmarkResendAttachment, formatWordmarkAttachmentForResendApi } = require("../comms/emailBranding.cjs");
  const sdk = buildEmailWordmarkResendAttachment();
  const rest = formatWordmarkAttachmentForResendApi(sdk);
  assert.equal(rest.inline_content_id, "email-gradient-wordmark");
  assert.equal(rest.content_type, "image/png");
  assert.ok(!("inlineContentId" in rest), "REST payload must not use SDK camelCase");
});

test("production branded shell never uses data: or cid: URIs", () => {
  const { html } = buildProductionBrandedEmailShell({
    siteUrl: "https://www.setlistpickem.com",
    bodyText: "ArmenianMan, the run kicks off tomorrow.",
    ctaUrl: "https://www.setlistpickem.com/dashboard/picks",
    settingsUrl: "https://www.setlistpickem.com/dashboard/profile/notifications",
    ctaLabel: "Make Your Picks",
    signOff: "See you on tour!",
  });
  assert.ok(!html.includes("data:image"), "production HTML must not embed data: URIs");
  assert.ok(!html.includes("cid:"), "production HTML must not use CID attachments");
  assert.match(html, /\/branding\/email-gradient-wordmark\.png/);
});

test("buildBrandedEmailHtml renders gradient wordmark, sign-off, teal CTA, and top accent", () => {
  const html = buildBrandedEmailHtml({
    siteUrl: "https://www.setlistpickem.com",
    bodyText: "ArmenianMan, the run kicks off tomorrow.",
    ctaUrl: "https://www.setlistpickem.com/dashboard/picks",
    settingsUrl: "https://www.setlistpickem.com/dashboard/profile/notifications",
    ctaLabel: "Make Your Picks",
    signOff: "See you on tour!",
  });
  assert.match(html, /\/branding\/email-gradient-wordmark\.png/);
  assert.match(html, /border-top:2px solid #2dd4bf/);
  assert.match(html, /background-color:#2dd4bf/);
  assert.match(html, /color:#020617/);
  assert.match(html, /Make Your Picks/);
  assert.match(html, /See you on tour!/);
  assert.ok(!html.includes("web-app-manifest-512x512.png"), "vinyl logo removed from shell header");
});

test("buildBrandedEmailHtml joins multi-line bodies into a single <p> with <br> breaks", () => {
  // Gmail's content-folding heuristic collapses stacked short <p> blocks
  // behind a clickable "..." pill; a single <p> with <br> line breaks avoids it.
  const html = buildBrandedEmailHtml({
    siteUrl: "https://www.setlistpickem.com",
    bodyText: "Line one.\nLine two.\nLine three.",
    ctaUrl: "https://www.setlistpickem.com/dashboard",
    settingsUrl: "https://www.setlistpickem.com/dashboard/profile/notifications",
  });
  const bodyParagraphCount = (html.match(/<p style="margin:0 0 20px 0/g) || []).length;
  assert.equal(bodyParagraphCount, 1, "body text should render as a single <p> block");
  assert.match(html, /Line one\.<br \/>Line two\.<br \/>Line three\./);
});

test("buildBrandedEmailHtml escapes body text to avoid HTML injection", () => {
  const html = buildBrandedEmailHtml({
    siteUrl: "https://www.setlistpickem.com",
    bodyText: "Hi <script>alert(1)</script>",
    ctaUrl: "https://www.setlistpickem.com/dashboard",
    settingsUrl: "https://www.setlistpickem.com/dashboard/profile/notifications",
  });
  assert.ok(!html.includes("<script>alert(1)</script>"));
  assert.match(html, /&lt;script&gt;/);
});

test("escapeHtml escapes the standard entity set", () => {
  assert.equal(escapeHtml(`<a href="x">'&'</a>`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
});

const fakeAdmin = {
  firestore: { FieldValue: { serverTimestamp: () => "ts" } },
};

/** Fake Firestore with transaction support, for the daily-cap wiring tests (#453). */
function makeFakeTxDb(seed = {}) {
  const store = new Map(Object.entries(seed));
  function makeRef(name, id) {
    const key = `${name}/${id}`;
    return {
      _key: key,
      async get() {
        return { exists: store.has(key), data: () => store.get(key) };
      },
    };
  }
  return {
    collection(name) {
      return { doc: (id) => makeRef(name, id) };
    },
    async runTransaction(updateFn) {
      const tx = {
        async get(ref) {
          return ref.get();
        },
        set(ref, data, opts) {
          const prev = store.get(ref._key) || {};
          store.set(ref._key, opts?.merge ? { ...prev, ...data } : data);
        },
      };
      return updateFn(tx);
    },
  };
}

test("daily cap (#453): second same-day trigger for a user is skipped, first is not double-charged", async () => {
  const captured = [];
  const db = makeFakeTxDb();
  const worker = createCommsEmailWorker({ resendClient: fakeResend(captured), db, admin: fakeAdmin });

  const first = await worker({ ...baseCtx, triggerId: "tour_engagement_reminder", dedupId: "tour_engage:u1:t1" });
  assert.equal(first.ok, true);
  assert.equal(captured.length, 1);

  const second = await worker({ ...baseCtx, triggerId: "tour_rankings_daily", dedupId: "tour_rank:u1:2026-07-18" });
  assert.equal(second.ok, false);
  assert.equal(second.skipReason, "daily_email_cap");
  assert.equal(captured.length, 1, "capped attempt must not call Resend");
});

test("daily cap (#453): account_welcome always sends even after the day's slot is used", async () => {
  const captured = [];
  const db = makeFakeTxDb();
  const worker = createCommsEmailWorker({ resendClient: fakeResend(captured), db, admin: fakeAdmin });

  await worker({ ...baseCtx, triggerId: "tour_countdown", dedupId: "tour_countdown:t:u1:1" });
  assert.equal(captured.length, 1);

  const welcome = await worker({ ...baseCtx, triggerId: "account_welcome", dedupId: "welcome:u1" });
  assert.equal(welcome.ok, true);
  assert.equal(captured.length, 2, "account_welcome must not be blocked by an already-used slot");
});

test("daily cap: bypassDailyCap lets every trigger send in one sitting (admin QA preview)", async () => {
  const captured = [];
  const db = makeFakeTxDb();
  const worker = createCommsEmailWorker({ resendClient: fakeResend(captured), db, admin: fakeAdmin });

  const first = await worker({ ...baseCtx, triggerId: "tour_countdown", bypassDailyCap: true });
  const second = await worker({ ...baseCtx, triggerId: "tour_rankings_daily", bypassDailyCap: true });
  const third = await worker({ ...baseCtx, triggerId: "tour_engagement_reminder", bypassDailyCap: true });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(third.ok, true);
  assert.equal(captured.length, 3, "bypassDailyCap must skip the cap reservation entirely");
});

test("daily cap (#453): skipped entirely when admin is not provided (backward compatible)", async () => {
  const captured = [];
  const db = makeFakeTxDb();
  const worker = createCommsEmailWorker({ resendClient: fakeResend(captured), db });

  const first = await worker({ ...baseCtx, triggerId: "tour_countdown" });
  const second = await worker({ ...baseCtx, triggerId: "tour_rankings_daily" });
  assert.equal(first.ok, true);
  assert.equal(second.ok, true, "no admin instance means the cap check is skipped, not enforced");
  assert.equal(captured.length, 2);
});
