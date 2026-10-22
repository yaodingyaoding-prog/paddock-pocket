# Motion and neutral artwork refinement

## Visual direction

The login and viewing-entry illustration is a fictional graphite/titanium racing concept. It has no real-team identity, sponsor, driver number or team livery. It replaces the earlier flat SVG; no photograph of any of the eleven teams is used. The generated alpha cutout is encoded as a 260 KB WebP with explicit dimensions to avoid layout shift. Existing factual team photographs elsewhere are unchanged.

## Motion changes

Previous navigation waited for a document-level View Transition capture, animated page bounds and remounted the navigation's glass effect/icon on each selection. The new flow animates the live content pane with opacity and translation only: a 75 ms departure followed by a 235 ms entrance. Fixed navigation remains outside that animation and responds at pointer-down. Its glass layer and icons retain their DOM identity and move through CSS transitions without restarting a spring sequence.

Rapid requests cancel obsolete destinations. Where supported, animation styles are committed before cancellation so the next transition begins from the current visual position. Hash/history navigation still uses the same route parser. Unsupported animation engines and reduced-motion settings commit directly without preventing navigation. No duplicate page, iframe, canvas or API request is created for an exit effect.

The per-second countdown state now belongs to its numeric component. The full app updates time once per minute, at the next session boundary and on returning to a visible tab. This avoids rerendering the full standings/profile/tool tree once per second while preserving countdown and session changes.

The glass navigation uses one persistent lens, a shorter monotonic easing curve and restrained deformation during pressing. Backdrop blur is reduced from 22 to 14 pixels. Motion and reduced-transparency accessibility preferences remain supported.

## Validation

- Project check suite and production build.
- Focused cancellation tests ensure a superseded exit does not commit and a normal exit/entrance commits once.
- Desktop login artwork loading and mobile viewing-entry layout.
- Mobile navigation: rapid schedule/standings/discover switching, matching selected and displayed destinations, final opacity 1 and no residual transform.
- Existing account, recovery, weather, standings and portrait checks continue to run.

These checks do not establish a frame-rate guarantee on every iPhone; real-device assessment remains useful for the subjective transition feel.

Rollback tag: `backup/pre-motion-tuning-20261022-0ed0d39`. Android 0.6.0 loads the production website and receives these UI changes without a new native package.
