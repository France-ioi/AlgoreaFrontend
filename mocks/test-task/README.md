# Test task (platform-task interaction)

Static page implementing the Bebras task API over jschannel. It is **not** part of the Angular build and is never deployed to production.

## Launch (manual testing)

You need **two local servers**:

| Server | Port | Role |
|--------|------|------|
| Mock server | `3000` | Serves this test task at `/test-task/` |
| Angular dev server | `4200` | The Algorea platform (`ng serve`) |

### 1. Start the servers

**Option A — both at once** (when port 4200 is free):

```bash
npm start
```

**Option B — mock only** (when `ng serve` is already running in another terminal):

```bash
npm run mock
```

If `npm start` fails with *“Port 4200 is already in use”*, you already have the platform running: keep it and use option B.

No backend or API setup is required: the test task is plain static files. If the mock server prints *“API mocks disabled: mocks/types/schema.ts is missing”*, you can ignore it — that only affects the API mocking feature (see [mocks/README.md](../README.md)), not the test task.

### 2. Task URL

Set the **task URL** of a dev Task item to:

```
http://localhost:3000/test-task/index.html
```

Add query parameters for scenarios if needed (see [Scenario query parameters](#scenario-query-parameters) below). The platform adds `channelId` and other params automatically when it loads the iframe — do not add them yourself.

Examples:

```
http://localhost:3000/test-task/index.html?usesTokens=1
http://localhost:3000/test-task/index.html?apiVersion=1&minApiVersion=1
```

### 3. Open the item in the platform

1. Go to [http://localhost:4200/](http://localhost:4200/) and open the Task item you configured.
2. Wait for the iframe status to show **Ready**.
3. Use the **Platform calls** buttons inside the iframe to trigger `platform.*` methods.
4. Read the **Platform → task call log** to see what the platform sent (`task.load`, `task.getAnswer`, …).

Opening `http://localhost:3000/test-task/index.html` directly in a browser tab is only useful to check that the mock server is up; jschannel needs the platform parent frame, so the page will stay on *“Waiting for platform…”*.

**Known limitation (manual mode):** the task cannot produce a signed `score_token` (that requires the task platform's private key), so it returns a null token and the raw score is sent to `/items/save-grade`. The backend accepts that only when the item's task platform is not configured to require tokens; otherwise `platform.validate` fails at the save-grade step (earlier steps — answer saving, answer token, `task.gradeAnswer` — can still be observed). In e2e this is not an issue since the backend endpoints are mocked.

## E2E testing

Playwright serves the same files from disk via route interception (`routeTestTaskAssets` in `e2e/items/pages/test-task-page.ts`). Specs live in `e2e/items/task-platform-interaction.spec.ts`.

Run:

```bash
npm run e2e -- e2e/items/task-platform-interaction.spec.ts
```

## Scenario query parameters

| Parameter | Effect |
|-----------|--------|
| `apiVersion` / `minApiVersion` | Negotiated task API version (default 2 / 1) |
| `usesTokens=1` | Task metadata requests token flow (`task.updateToken`) |
| `autoHeight=1` | Metadata `autoHeight: true` |
| `loadDelay=ms` | Delay `task.load` completion |
| `gradeDelay=ms` | Delay `task.gradeAnswer` completion |
| `failGrade=1` | Make `task.gradeAnswer` fail |
| `score=N` | Fixed grade score instead of parsing the answer |
| `solutionOnTokenUpdate=1` | Hide the `solution` view until a token is pushed *after* load (simulates solution access granted on validation). Combine with `usesTokens=1`. |

## API coverage

### Platform → task (logged automatically)

`task.getMetaData`, `task.load`, `task.unload`, `task.getHeight`, `task.updateToken`, `task.getAnswer`, `task.reloadAnswer`, `task.reloadAnswerWithOptions`, `task.getState`, `task.reloadState`, `task.getViews`, `task.showViews`, `task.gradeAnswer`, `task.getResources`, `task.deviceProxy`

### Task → platform (buttons in the page)

`platform.validate`, `platform.updateDisplay`, `platform.updateHeight`, `platform.openUrl`, `platform.showView`, `platform.getTaskParams`, `platform.askHint`, `platform.log`, `platform.deviceProxy` (via device proxy buttons)

## Programmatic access (e2e / debugging)

Inside the iframe:

- `window.testTaskCalls` — array of `{ method, params, timestamp }`
- `window.testTaskState` — `{ answer, state, token, shownViews, loaded, solutionGranted }`
- `window.testTask` — helpers (`setAnswer`, `getCalls`, …)

## Keeping in sync

When changing [task-proxy.ts](../../src/app/items/api/task-proxy.ts) or `item-task-*` services, update this page and `e2e/items/task-platform-interaction.spec.ts` in the same change.
