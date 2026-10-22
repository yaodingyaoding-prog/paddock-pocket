# Race interface refresh — 22 October 2026

## Release baseline and rollback

Before editing, the working tree was clean at `a17e1019d419acad66c60ff47d49772f39cab4cf`.

- Git tag: `backup/pre-design-refresh-20261022-a17e101`.
- Source archive: `D:\F1push\backups\paddock-pocket-a17e101-source.zip`.
- Archive SHA-256: `D3184DDC0B76614246CE466CA62D1B49E97682526741940ADE565CBF89D632E6`.
- Full Git bundle: `D:\F1push\backups\paddock-pocket-a17e101.bundle`.
- Cloudflare production version before this release: **feb18e2e**, confirmed in deployment activity against the same commit. Build: `573d0c8c-20b7-4b14-938e-681d683c4c74`.

For the fastest production rollback, use Workers → paddock-pocket → Deployments → version `feb18e2e` → rollback/deploy that version. This preserves the existing authentication settings and avatar storage; no database migration is involved in this refresh. Then restore the tagged source as a new commit on main so the next automated build cannot silently replace the rollback. Do not use a destructive hard reset against later work. The source archive and bundle provide a second recovery path if the checkout is unavailable.

## Design and navigation

Four primary destinations: schedule, standings, discover and profile. Live viewing, news and replay discovery live in Discover. Profile no longer repeats those launchers. The former `#widgets` route forwards to profile so old bookmarks still work.

Standings show five entries initially, with an explicit expand/collapse control. Each driver name has a profile arrow and an explanatory button. Championship analysis is a small utility below the table.

Profile combines an original fan licence design with a personal podium. This is an account card, not an FIA-issued racing credential. Up to three individual drivers can be followed; teams are followed separately. Driver order on this podium follows selection order, not race finishing order. Old single-driver preferences migrate locally; no cloud synchronisation of these preferences is claimed. Private account avatar upload/crop and storage remain unchanged.

The homepage circuit accepts drag rotation directly. Enlarging is optional, with separate reset and expand buttons; no button wraps the interactive canvas. Zoom remains available in the enlarged view. Orbit controls are restricted to the canvas, not document-wide touch events.

Podium names and teams appear above larger, original full-body photographs. Read-only alpha analysis supplies CSS placement bounds for 23 existing transparent images; the source image files are unchanged. Actual feet meet the podium surface, including images with different transparent margins. The podium is a personal selection order, not a race classification.

Existing 2026 team-car images are enlarged in constructor standings, team details and the selected-team technical view. They are labelled team season displays and are not presented as a specific driver's car or an upcoming special livery. Historical constructor standings avoid substituting the 2026 display. References: [McLaren MCL40](https://www.mclaren.com/racing/formula-1/2026/mcl40-launch/), [Mercedes W17](https://www.mercedesamgf1.com/car/2026), [Red Bull RB22](https://www.redbullracing.com/int-en/cars/rb22).

Motion has distinct roles: directional page arrival, button pressure, selection pop, sheet arrival and an elastic navigation lens. The floating bottom navigation uses CSS translucency, backdrop blur, highlight borders and a sliding lens inspired by Liquid Glass. This is a web approximation, not Apple's native rendering engine. Reduced-motion, reduced-transparency, contrast preferences and unsupported blur have fallbacks. No animation library or image asset was added.

Design references, used for hierarchy and interaction principles:

- [Apple: Materials](https://developer.apple.com/design/human-interface-guidelines/materials) and [Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/liquid-glass): floating controls separate from content, restrained transparency and accessible fallbacks.
- [McLaren Formula 1](https://www.mclaren.com/racing/formula-1/): race-led information hierarchy and distinct sections.
- [Formula 1 standings](https://www.formula1.com/en/results/2026/drivers): points-first table structure.
- [MotoGP](https://www.motogp.com/en): separate schedule/results/standings destinations.

## Registration investigation

User report: around 17:00 Asia/Shanghai, while entering the password, a first-time registrant saw a frequent-operation warning. Password input does not call registration, sign-in or resend endpoints. These requests run only on form submission or an explicit resend action. Therefore the reported timing alone does not identify the source of that warning.

A reproducible defect was found: invalid form submissions consumed the per-email cooldown before validation. A regression initially failed with an invalid password followed by a corrected form. Validation now runs after the IP abuse check and before spending an email slot. The regression passes. The client uses a synchronous submit guard, observes `Retry-After`, and prevents repeated submissions during a known cooldown.

Provider email quotas, provider request limits, local shared-IP limits and local email cooldown now have distinct error codes and user messages. Only known local 60-second limits advertise a precise retry interval; project-wide provider quota errors do not promise a 60-second reset. Sanitised error logs record operation, status and code, without passwords, emails, tokens or IPs. Existing rate limits, email verification and access protection remain enabled.

Supabase settings confirmed a 60-second per-user interval and 30 sign-up/sign-in requests per five minutes per IP. The email-limit value was unavailable to inspection. Historical logs were not obtained, so the friend's exact incident is not labelled as conclusively diagnosed. See [Supabase rate limits](https://supabase.com/docs/guides/auth/rate-limits) and [custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## Weather reliability

The old implementation called Open-Meteo directly from each browser and had no server-side failure log. The exact afternoon failure cannot be reconstructed from those client-only errors. A current live probe returned a valid `America/Chicago` forecast with 384 hourly samples.

`/api/weather` now provides a same-origin, authenticated controller/service/repository path. Coordinates must exactly match the bundled circuit registry. The upstream destination is fixed. Responses are validated and requests time out after 10 seconds. In-flight calls coalesce per worker; public forecasts are cached in memory and Cloudflare's cache. Fresh forecasts are reused for at least five minutes. Failed calls back off for one minute. Cache read/write failures do not prevent an upstream attempt or an otherwise valid response.

Upstream failures may use a forecast obtained within the last six hours, explicitly marked stale and retaining the original acquisition time. Older cached weather is rejected. Browser visibility, network and event-driven refresh cadence remain: five minutes around sessions, hourly within 48 hours, otherwise three-hourly. The page must be open to request refreshes; the developer's computer need not be running. No paid weather subscription or new scheduled job is required. [Open-Meteo service limits and usage](https://open-meteo.com/en/pricing) still apply; this is not a promise of uninterrupted delivery.

## Verification

- Existing results, championship, telemetry, portraits, startup, fonts, replays, account and personal-feature suites.
- New regression: invalid registration correction does not spend an email slot.
- New tests: independent driver/team selections, legacy migration, three-driver cap, distinct provider errors, weather schema, location allowlist, coalescing, freshness, stale age, outage backoff and timeout handling.
- Production build and browser checks are recorded in the release acceptance notes.

### Local acceptance

`npm run check` passed, including 65 authentication checks and the added weather/following cases. `npm run build` succeeded. Added-content credential scanning and Git whitespace checking passed.

Browser acceptance covered a 390 × 844 viewport and desktop layouts: four navigation destinations; five driver rows expanding to 23; the three-driver picker keeping three selected and disabling the remaining 20; independent team selection; loaded full-body images with feet aligned to podium surfaces; light-theme readability; and successful same-origin weather delivery. The inline canvas was dragged into a visibly different orientation without opening a dialog, and reset restored the view. A legacy `pointer-events: none` rule was discovered during this check and overridden specifically for the interactive homepage canvas.

The final visual pass replaces repeated card outlines with an open weather ribbon, a session timeline, an unboxed podium, grouped settings and varied editorial discovery layouts. The fan licence and car showcase keep their purposeful boundaries. These are browser viewport checks, not a claim of new physical iPhone or Android installation testing.
