# First visit recovery implementation plan

> Execute inline using superpowers:executing-plans; regression tests precede changes.

Goal: Make first visits readable, recover from interrupted modules, and avoid loading 3D before it is requested.

Architecture: Keep server-rendered race data visible while React starts. Preserve an independent startup watchdog, add a route-level error boundary with an explicit document reload, align public GET budgets with the server, and keep a static circuit preview until 3D is requested.

Stack: Existing React 19, Vinext/Vite, Cloudflare Worker. No new packages.

Scope/spec: User authorized direct repair after reporting first visits show only a shell in Android browsers and WeChat. Exact device failure has not been reproduced; report that verification limit.

Ruling: Work in the existing clean checkout on a dedicated fix branch; reuse installed dependencies. User requested direct execution, so do not add design approval or worktree setup gates. No deployment or push until verification is complete; prior chat authorization covers fixing the deployed website.

## Tasks and ledger

- [x] Startup: extend `scripts/verify-boot-status.mjs` to require immediately visible content, early same-origin runtime failure reporting, ignored extension failures, and cleared notices on ready. Hide startup markup in `app/layout.tsx`; update `lib/boot-status.ts` without automatic reload loops.
- [x] Requests: add a regression to `scripts/verify-public-read.mjs` with a response arriving after 6 seconds but before the backend's 6.5-second fallback. Fix the default budget in `lib/public-read.ts`; retain bounded retries and cancellation.
- [x] Modules: add `app/recoverable-section.tsx` around lazy routes/dialogs. Tests exercise a real throwing child, recovery on navigation, explicit reload, and intact navigation outside the boundary. Do not reset a rejected React.lazy promise and pretend it will re-download.
- [x] Circuit: render the real static image before user interaction. Only mount Scene after enabling 3D; keep the image and offer retry when WebGL/model loading fails. Tests cover initial SSR preview and browser request interception.
- [x] Verify: run targeted regressions, full `npm run check`, WeChat suite and production build. Test first-load/mobile viewport, delayed/failed resources, and unavailable WebGL in a browser. Review the diff independently before shipping.

Review focus: session data must survive reload recovery; error UI must not hide navigation; a 3D failure must leave readable race data; unsupported native dialog APIs must not crash the route; user-visible fallback data must keep its original timestamp.

## Verification results

- Startup and slow-response regressions failed before the fixes and pass afterward.
- Real browser tests exercise module failure, intact navigation, full-document retry, missing native dialog APIs, WebGL rejection and an engine module stalled beyond 15 seconds.
- Full check, native WeChat service/page checks, production build and source fingerprint passed. Existing Vinext ineffective-dynamic-import warnings remain.
- Production preview: with JavaScript disabled, SSR race text and a decoded circuit preview remain visible. A fresh 393 px mobile/WeChat user-agent context with 4x CPU throttling and constrained network starts without page exceptions and does not request Three.js/STL. Blocking the profile chunk shows a local recovery action; navigating to the schedule still works.
- Independent review identified and resolved the unprotected team dialog and unbounded engine import. Re-review found no further important defects.
- Actual Android/WeChat hardware is not connected; user-agent and network emulation do not prove those real-device results.
