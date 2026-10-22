# Interaction refresh — 22 October 2026

## Changes

- Replaced trailing open/detail arrows with icon-only affordances: a contact card for drivers, an ellipsis for content entries and a link symbol for external sources. No explanatory labels were added.
- Added outgoing/incoming page transitions and directional navigation. Browsers without same-document View Transitions use the CSS entrance animation; reduced-motion preferences suppress the effects. Rapid navigation uses the latest destination, and capture failures cannot block a route update.
- Strengthened the bottom navigation lens deformation and staggered list entrance effects.
- Added continuously animated light fields, circuit traces and streaks to login and registration, including mobile layouts. An icon-only pause control stops background motion; reduced-motion preferences disable it.
- Replaced the shared, decorative `FAN / 01` label with `FAN PASS`. The existing account-derived member identifier remains; no sequential membership numbering is implied.
- Removed the car photograph section from driver biographies and collapsed the vacated column. Team car imagery remains available in team details.

## Verification and rollback

Type checks, the project regression suite and a production build passed. Navigation coverage includes unsupported/reduced-motion environments, synchronous and asynchronous capture failures, rapid destination changes and duplicate callbacks. Browser checks covered driver entries, return navigation, licence text, mobile authentication and the motion pause control.

The preceding release is preserved by tag `backup/pre-interaction-refresh-20261022-89bf46b` and a source archive in the workspace backup directory. Its production Cloudflare version was `9d90e5e9`.
