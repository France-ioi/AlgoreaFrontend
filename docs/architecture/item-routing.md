# Item route parameters (attempts)

Reached from [ARCHITECTURE.md](ARCHITECTURE.md) when changing item URL params, attempt selection, breadcrumbs, or explicit-entry flow.

Items support complex routing with:

- `path`: Navigation breadcrumb path
- `parentAttemptId`: Attempt context
- `attemptId`: Selected self attempt (URL concern only). The attempts list is cached per attempt context via `resultsFetchKey` (parent attempt when present; otherwise the self attempt). Sentinel `a=new` (`newAttemptId`) means the user requested a brand-new attempt (explicit-entry flow from the attempts tab); it is excluded from `isRouteWithSelfAttempt` and `resultsFetchKey` so it is never forwarded to the API. Parsing rejects `a=new` without `pa=` as a route error so `FullItemRoute` always keeps a real attempt context. `ensureAttemptInUrlEffect` writes a missing `a=` into the URL (`pick` or implicit `start`) with `replaceUrl`, keeping `pa` when both are present — except it leaves `a=new` alone on explicit-entry items. Breadcrumbs use full-route identity and refetch on attempt change. Breadcrumb failover on 403 starts the result path (`isRouteWithSelfAttempt` decides ancestors-only vs ancestors+item), retries breadcrumbs with the returned attempt id, and `replaceUrl`-navigates when that attempt differs from the URL. In the self-attempt failover case the recovered route clears `pa`. After a successful start-result-path, breadcrumbs also refetch when `itemRouteErrorHandlingActions.resultPathStarted` overlaps the active item route (failover starts do not dispatch that action, so they do not retrigger the outer fetch). The Attempts tab (`/attempts`) is the UI surface for listing, selecting, and creating attempts. The explicit-entry gate is shown only when no attempt is selected (no result or `a=new`); a selected attempt past `allows_submissions_until` keeps rendering its content read-only behind an info banner.
- `observedGroupId`: Observation mode
