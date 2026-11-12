# Task ↔ platform integration

Reached from [ARCHITECTURE.md](ARCHITECTURE.md) when changing Bebras task loading, tokens/views, device proxy, unload, or `mocks/test-task/`.

## Task API versioning

Task API versioning is negotiated at load time via optional `apiVersion` / `minApiVersion` fields returned by `task.getMetaData()`. The platform supports versions 1–3 and picks the highest version in the overlapping range. When the negotiated version is ≥ 2, `Task.reloadAnswer()` dispatches to the v2 wire method `task.reloadAnswerWithOptions`, passing `idUserAnswer` when reloading a submitted answer so the task can fetch submission feedback from its own backend using the signed task token.

Optional metadata `savesHistory` (boolean) is honored only when the negotiated version is at least 3. The platform derives one **saves editor history** flag (`negotiated ≥ 3` and `savesHistory === true`). When that flag is set, the task owns work in progress: the platform does not autosave, save-on-leave, save-on-tab-close, or save beside a submission; it does not reload a leftover platform current answer on open; and “Edit it” does not back up WIP as a saved answer. Submissions are still graded and can still be viewed or loaded editable. Decision about loading the current answer waits until metadata is known on a fresh load.

When the negotiated version is ≥ 3, the task proxy exposes `task.getHistory(options)` (validated with a Zod history-element schema). Options cover `onlyCheckpoints`, `minId` (exclusive), `maxId` (inclusive), and `limit` (default 100, max 1000). The History page can merge checkpoints with the attempt-filtered activity log when the signed-in user’s task is already loaded on the URL attempt. Same-second ordering: a checkpoint appears above an event at the identical second in the newest-first list.

## Device proxy (Web Bluetooth / WebSocket)

Browsers increasingly block iframes from using Web Bluetooth or opening WebSockets to localhost. Tasks that need these APIs call `platform.deviceProxy(category, method, args)` over jschannel; the platform runs the real operation via [bebras-device-proxy](https://github.com/France-ioi/bebras-device-proxy) (`DeviceProxyService` → UMD `device-proxy-platform.js`, lazy-loaded from `assets/scripts/` on the CDN). The script URL comes from `bundleAssetUrl()` in [deploy-url.ts](../../src/app/utils/deploy-url.ts), resolved against `import.meta.url` (the running bundle, which lives in the `--deploy-url` folder); the path argument is kept in a variable so Vite does not rewrite `new URL(..., import.meta.url)` into `import.meta.glob`. Do not derive it from the page's `<script>` tags: per-deployment `customHeadTags` (e.g. Matomo) may insert foreign absolute scripts first. Async device events (BLE notifications, WebSocket messages/close) are pushed back to the task: the module calls `window.task.deviceProxy(...)`, bridged by `DeviceProxyService.connectTask()` onto a new `task.deviceProxy` channel call. `DeviceProxyService.disconnectTask()` (on task teardown) invokes the module's `cleanup()` to close connections, then replaces `window.task` with a no-op stub so late async events from `cleanup()` cannot throw.

**Constraint:** at most one task iframe may use the device proxy at a time. The module holds singleton connection state and a single `window.task` bridge; the app currently mounts one `alg-item-display` per item view. Two simultaneous task iframes (e.g. split comparison) are unsupported.

## Showing the solution tab right after validation

Whether a task exposes its `solution` view is decided by the task itself, from the `bAccessSolutions` claim in its signed task token (the backend grants it once the user has validated the item). The platform no longer gates the solution tab in [item-tabs.ts](../../src/app/items/item-tabs.ts) — the task is the source of truth. To make the tab appear immediately after a validating submission without a full reload:

- [ItemTaskInitService](../../src/app/items/services/item-task-init.service.ts) generates the task token via a `combineLatest` of the generation strategy and a `refreshToken$` subject, so `refreshToken()` re-generates a fresh token even when the strategy is unchanged. Only the **first** token is used for `task.load()` (`take(1)`); later tokens are pushed to the loaded task via `task.updateToken()` and surfaced on `tokenUpdatedOnTask$`. A refresh-path generation failure is swallowed (`retry`/`catchError`) so it never errors the shared `taskToken$` (also consumed by `submitAnswer()`); token-less tasks (`usesTokens: false`) are never pushed a token.
- [ItemTaskAnswerService](../../src/app/items/services/item-task-answer.service.ts) calls `refreshToken()` after a grade is saved when the backend's `save-grade` response reports `validated: true` and the result was not already validated (snapshotted before `patchScore` flips `validated`).
- [ItemTaskViewsService](../../src/app/items/services/item-task-views.service.ts) re-calls `task.getViews()` on each `tokenUpdatedOnTask$` emission, because tasks (e.g. codecast) refetch their content on `task.updateToken` but do not spontaneously re-advertise views. The refreshed view list flows through `tabsChange` → `ItemTabs.setTaskTabs`, and the tab bar recomputes.

## Leaving a task (unload then destroy)

When the user leaves a loaded task (another item, leaving the items area, or retry remount), the platform calls Bebras `task.unload` on the live JSChannel and **then** `destroy()` (channel teardown). In-app leaves **await** unload (task-proxy timeout 2000ms; errors/timeouts still proceed to destroy). Tab close/refresh is best-effort only (fire-and-forget, same as save-on-close). Item→item navigation keeps a sticky last-ready `ItemData` so the iframe stays mounted until awaited teardown finishes.

## Test task for platform-task integration

[mocks/test-task/](../../mocks/test-task/) is a static jschannel task page used to exercise platform↔task flows without relying on external task content. It is served by the dev mock server (`http://localhost:3000/test-task/`) and never included in Angular production builds. E2E tests intercept the same files via Playwright (`e2e/items/task-platform-interaction.spec.ts`). Update it whenever the task API surface changes. See also [mocks/test-task/README.md](../../mocks/test-task/README.md).
