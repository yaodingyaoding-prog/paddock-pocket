# Login and motion refresh · 2026-10-23

## Scope and assumptions

Rebuild page motion and the login / registration visual system for the existing phone, tablet and desktop application. The user requested continuous F1-inspired motion and more varied, uninterrupted transitions. Preserve the existing account services, validation, routes and device preferences. Avoid team-specific or photographic car artwork, following the earlier visual preference.

No new animation framework, external image service or per-frame React state is introduced. The same app serves the existing deployment; this change does not alter account capacity or data polling. Existing origin, session and recovery checks remain unchanged. Respect reduced-motion preferences and pause decoration when the document is hidden.

## Evidence and decisions

- The previous content transition deferred its route callback until a 75 ms exit completed. A new regression asserting an immediate callback failed against that implementation. Navigation now commits synchronously and animates the incoming content, without waiting for an exit or a document snapshot.
- The previous glass navigation set a preview target on pointer down, cleared it on pointer up, then selected it again on click. The persistent glass lens now follows the committed route, which updates synchronously. Press feedback remains CSS-only.
- A full content pane can be taller than the viewport (the Discover baseline measured 976 px at a 720 px viewport). The new adapter walks at most 40 elements and animates at most six visible blocks, instead of promoting the entire scrolling pane into a large moving layer.
- Main destinations rise into place; details enter horizontally; returning reverses that direction. Visible blocks have short, bounded staggers. Dialogs settle with a small scale change, driver dossier tabs slide, expanded standings reveal new rows, and existing choice/follow feedback remains independent.
- Staggered animations use backwards fill during their delay and no forwards fill. This prevents a block first appearing in its final position and jumping back when its delay starts. Cancellation leaves no committed inline animation styles.
- The login design uses a dark racing scene and ivory form panel. A custom circuit, five light pods, sector strips, kerbs, flag checker and large condensed type provide racing identity without real car photos or team liveries. Decorative timing is not live race data.
- Continuous laps, light sequences, sector fills and light sweeps use CSS/SVG. No animation is driven by typing, account requests, fake race results or a React interval. Mobile retains a compact circuit scene above the form.

## Validation

- `npm run check`: types and existing feature / account regression checks, plus new motion cases.
- New cases cover immediate route callbacks, cancellation, rapid destination changes, completion cleanup, different motion recipes and animation failures. Existing reduced-motion and unsupported-animation fallbacks remain covered.
- `npm run build`: production build.
- Browser acceptance checks cover desktop and 390 px phone layouts, navigation, expandable standings, driver details and the login / register / recovery forms. These are browser checks, not claims of physical iPhone or Android device testing or guaranteed frame rate on all hardware.

## Recovery

Original affected files were copied to `D:\F1push\backups\ui-motion-login-20261023` before changes. `base-commit.txt` records the preceding published source revision. README work is committed separately from this UI change. The production release can also be rolled back using the previous Cloudflare version.
