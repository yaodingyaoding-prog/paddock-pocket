# Account preferences and cross-device sync

Signed-in driver follows, team follows, theme, accent and IANA time zone are stored in Supabase PostgreSQL, in `public.paddock_preferences`. Nicknames and avatars continue to use the existing account and private-avatar services. This replaces browser-local settings as the source of truth.

## Setup

Run [account-preferences.sql](account-preferences.sql) once in the existing project's SQL editor before deploying the application. The migration creates a dedicated table, owner-only RLS policies and an atomic patch function. It does not modify existing users or avatar data. It uses the existing authenticated client and publishable key; no service-role key or new secret is required.

`GET /api/auth/preferences` reads only the current verified session's row. `PATCH` validates a strict `{patch, initialize?}` payload, checks the request origin, bounds the request to 8 KiB and rate limits saves. A user ID is never accepted from the browser. All responses are private and non-cacheable. Direct database reads and writes are additionally restricted by RLS to `auth.uid() = user_id`; anonymous access is not granted. Account deletion cascades to its preference row.

## Behaviour

- Login loads the cloud record. A browser with no stored preferences gets the same saved configuration as other devices.
- If the cloud row is absent, the first authenticated device migrates its own legacy follows and valid appearance/time-zone settings. Initialization uses an atomic insert and cannot overwrite an existing row, including simultaneous first use from two devices.
- After confirmation, the account's obsolete browser preference archive is removed. A later device's old local settings never replace the cloud record. If an empty device initializes first, older settings on another device are not automatically imported over it; select them again on that device to save the intended configuration.
- Changes apply immediately to the interface and queue a save after 650 ms. Saves are serialized; only edited fields are patched. Database row locking preserves unrelated changes from another device. If two devices change the same field, the last database commit wins. A driver's selection list is one field and a team's selection list is another.
- While visible, the app reads updates every 30 seconds and on focus, return to the foreground or restored network connectivity. This is polling, not a persistent real-time socket. A hidden tab does not poll.
- Failed saves show an error and retain unsaved changes in memory for explicit retry or a network/foreground retry. They are not reported as synced. Closing/reloading with pending changes invokes the browser's standard unsaved-changes prompt when supported. Unsaved edits cannot survive forced termination; reload reads the last confirmed cloud record.
- Logout first flushes pending changes, then clears account UI and opens `/login`. Failed saves keep the account visible so the user can retry without silently losing changes. Account disposal prevents delayed responses from repainting its private settings.
- Guests can preview choices in the current page but do not save personal preferences. Login is needed for cross-device persistence. Race data, weather and share-poster caches are separate from personal settings.
- The existing Android widget reads a minimal on-device mirror of confirmed driver/team follows. It is an output for the native widget, never the account preference source; logout empties it. Native background widget reads still depend on the existing App lifecycle and Android scheduling.

## Maintenance and verification

The implementation follows the existing route → controller → service → repository layers. BFRI assessment: architectural fit 5, testability 5, complexity 2, data risk 2, operational risk 2; result 4, requiring regression coverage and structured failure logs. No new platform or paid subscription is introduced; existing service quotas still apply.

`npm run check` covers validation, authentication, rejected foreign origins, account separation, one-time initialization, two independent device clients, atomic partial updates, failed-save retry and account disposal. Release acceptance must additionally verify the deployed SQL's RLS and patch behaviour plus two signed-in browser sessions without sharing local storage.
