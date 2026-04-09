# Show calendar tour names (Phish.net + Firestore)

Official **phish.com/tours** groupings (e.g. Summer Tour, Sphere as its own leg; Dick’s as part of summer) are **not** available as a stable machine-readable API. **Scraping phish.com** in Cloud Functions is possible in theory but is **brittle** (markup changes, caching, bot rules, maintenance) and is **not** implemented here.

**Source of truth for schedule rows:** Phish.net v5 `shows/showyear` (same as the monthly sync).

**Source of truth for *display* tour names** (after sync):

1. **`show_calendar/tour_overrides`** — optional doc; field **`byShowDate`** maps `YYYY-MM-DD` → tour string. **Highest priority.** Edit in Firebase Console (signed-in users can read; only Functions/admin can write—use Console as project owner, or Admin SDK).
2. **Phish.net named `tour_name`** — when the API returns a real tour name (not **`Not Part of a Tour`**), that string is used **before** the previous snapshot. If Phish.net **fixes or adds** a tour name later, the next sync picks it up automatically (overrides still win).
3. **Previous `show_calendar/snapshot`** — for NPT-only dates that **already existed** in the last snapshot, the **prior optgroup label is kept** so routine refresh does not rename ad-hoc legs you have not overridden.
4. **Heuristics** (`functions/phishnetShowCalendar.js` → `labelGenericCluster`) — used when none of the above apply (NPT clusters, etc.).

Example seed for manual labels: **`scripts/seed/show_calendar_tour_overrides.json`** (paste `byShowDate` into Firestore; omit `_comment`).

Each successful sync also writes **`reviewQueue`** on `snapshot` (empty on **first** sync when there is no prior snapshot): **new** show dates not yet in the previous snapshot, with **`suggestedTour`** from heuristics, for manual review. After you agree with the suggestion, you can add overrides; if you disagree, set **`byShowDate`** to the official phish.com tour name.

**Bulk pass on existing dates:** `reviewQueue` will not list dates that already existed in the last snapshot. To rename those to match phish.com, add **`byShowDate`** entries anyway — **overrides always win** over the preserved snapshot label. From repo root, **`npm run print:phishnet-tour-clusters`** prints current Phish.net clusters + computed labels (helpful checklist before you type overrides in Console).

**Related:** [PHISHNET_CALLABLE_RUNBOOK.md](./PHISHNET_CALLABLE_RUNBOOK.md) §8.
