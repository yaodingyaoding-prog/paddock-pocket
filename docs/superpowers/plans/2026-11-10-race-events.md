# Homepage race-control records

**Goal:** Add a compact homepage section for flags, safety cars and penalties, with real records and explicit unavailable states.

**Architecture:** A public read-only controller validates season/year/race, a service matches the existing race calendar to OpenF1 sessions and caches results, and a pure normalizer produces display events. The React card reads only the normalized endpoint. Reuse existing calendar service, caching, theme tokens and error patterns; add no dependency or subscription.

**Scope:** All sessions in a selected weekend, with a session selector. Default to the latest completed GP when the main hero shows a future round; an explicitly selected calendar round takes precedence. Collapse the card to three highlights; filters and expansion reveal the full chronological record. Preserve current mobile alignment and other homepage functions.

**Data rules:** Keep exact source timestamps and messages. Deduplicate repeated yellow-sector notices and penalty-served messages. Show confirmed decisions separately from investigations and revoked decisions. Never infer safety-car blame from temporal proximity; label contemporaneous incident messages as related records. Never turn a missing/failed feed into a zero-event claim. Historical coverage starts in 2023; no paid live endpoint or invented fallback record.

**Design:** Existing sand/dark theme tokens; red/yellow flag indicators, purple safety-car indicators, orange penalty indicators. One compact editorial section above the circuit overview in the existing sidebar. Controls retain 44px targets, labels and text stay within 320px, and the full event list scrolls within the section.

**Backend feasibility:** Fit 5, testability 5, complexity 2, data risk 1, operational risk 1: BFRI 6. Public reads only; no account or storage mutation. Use the repository's lightweight controller/service pattern instead of introducing Express or a monitoring service.

- [x] Normalize real race-control records; verify penalties, cancellations, identity, grouping and causality with regression cases.
- [x] Implement bounded OpenF1 repository, cached/coalesced service and validated public controller; verify context matching and failures.
- [x] Add compact homepage card, safe request cancellation, filters and session/race selection.
- [x] Run project checks/build plus real-data and phone/browser acceptance.

Release procedure: use the existing main-branch deployment workflow, wait for successful checks and verify the same browser acceptance against production.

## Follow-up: visible flag causes

Show explicit reasons from the flag message in the existing summary row, translating common incident, debris and weather descriptions. Keep track-sector location separate from the reason. If the source omits a reason, show an unknown state and, where available, one nearby incident labelled as unconfirmed context. Context must stay within the same session and qualifying phase, within 90 seconds; no extra live source or inferred responsibility. Preserve original messages on expansion and invalidate the old normalized cache. Verify direct causes, unknowns, context isolation, grouped flags and phone layout before release.
