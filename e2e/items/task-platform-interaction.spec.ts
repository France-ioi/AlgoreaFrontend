import { test, expect } from 'e2e/items/fixture';
import { initAsUsualUser } from 'e2e/helpers/e2e_auth';
import { apiUrl } from 'e2e/helpers/e2e_http';
import {
  mockTestTaskItemApi,
  routeTestTaskAssets,
  TEST_TASK_ITEM_ID,
  TEST_TASK_URL,
  TestTaskPage,
} from 'e2e/items/pages/test-task-page';

test.describe('platform-task interaction', () => {
  let testTaskPage: TestTaskPage;

  test.beforeEach(async ({ page }) => {
    await initAsUsualUser(page);
    await routeTestTaskAssets(page);
    await mockTestTaskItemApi(page);
    testTaskPage = new TestTaskPage(page);
  });

  test('loads the task and completes the jschannel handshake', async () => {
    await testTaskPage.gotoItem();
    await testTaskPage.waitForLoaded();

    await testTaskPage.waitForCall('task.getMetaData');
    const loadCall = await testTaskPage.waitForCall('task.load');
    expect(loadCall.params).toMatchObject({
      task: true,
      solution: true,
      editor: true,
      hints: true,
      grader: true,
      metadata: true,
    });
  });

  test('validate top triggers getAnswer, gradeAnswer, and save-grade', async ({ page }) => {
    await testTaskPage.gotoItem();
    await testTaskPage.waitForLoaded();

    const saveGradeRequest = page.waitForRequest(
      request => request.url().includes('/items/save-grade') && request.method() === 'POST',
    );

    await testTaskPage.setAnswer('80');
    await testTaskPage.clickValidate('top');

    await testTaskPage.waitForPlatformCall('platform.validate');
    await testTaskPage.waitForCall('task.getAnswer');
    const gradeCall = await testTaskPage.waitForCall('task.gradeAnswer');
    expect(gradeCall.params).toEqual(['80', 'mock-answer-token']);

    const request = await saveGradeRequest;
    const body = request.postDataJSON() as { score: number };
    expect(body.score).toBe(80);
  });

  test('showView asks the platform to switch tabs and reload task views', async ({ page }) => {
    await testTaskPage.gotoItem();
    await testTaskPage.waitForLoaded();

    await testTaskPage.clickShowView('solution');

    await testTaskPage.waitForPlatformCall('platform.showView');
    // skip the initial showViews({ task: true }) emitted on load
    const showViewsCall = await testTaskPage.waitForCall(
      'task.showViews',
      entry => (entry.params as { solution?: boolean }).solution === true,
    );
    expect(showViewsCall.params).toMatchObject({ solution: true });

    // the selected tab on top of the task must follow the view requested by the task
    await expect(page).toHaveURL(/task\/solution/);
    await expect(testTaskPage.activeTab()).toHaveText('Solution');
  });

  test('getTaskParams returns platform parameters to the task', async () => {
    await testTaskPage.gotoItem();
    await testTaskPage.waitForLoaded();

    await testTaskPage.invokeGetTaskParams();

    await testTaskPage.waitForPlatformCall('platform.getTaskParams');
    await expect(testTaskPage.taskFrame.getByTestId('task-params-result')).toContainText('randomSeed');
  });

  test('shows the solution tab after a validating grade without reloading the task', async ({ page }) => {
    // task that only exposes the 'solution' view once it receives a token *after* being loaded
    await mockTestTaskItemApi(page, { taskQuery: 'usesTokens=1&solutionOnTokenUpdate=1' });
    await testTaskPage.gotoItem();
    await testTaskPage.waitForLoaded();

    // before validation: no solution access, so no solution tab
    await expect(testTaskPage.taskFrame.getByTestId('solution-granted')).toHaveText('no');
    await expect(testTaskPage.tabByName('Solution')).toHaveCount(0);

    // register the request listener before triggering, so a fast save-grade cannot fire before we await it
    const saveGradeRequest = page.waitForRequest(
      request => request.url().includes('/items/save-grade') && request.method() === 'POST',
    );

    // validate with a passing score -> backend grants solution access on a freshly generated token
    await testTaskPage.setAnswer('100');
    await testTaskPage.clickValidate('done');

    await saveGradeRequest;

    // the platform regenerates the token and pushes it to the task (a 2nd updateToken, after the load-time one)
    await expect.poll(async () => {
      const calls = await testTaskPage.getCalls();
      return calls.filter(entry => entry.method === 'task.updateToken').length;
    }).toBeGreaterThanOrEqual(2);

    // the task now grants the solution and the platform re-queries the views, so the solution tab appears
    await expect(testTaskPage.taskFrame.getByTestId('solution-granted')).toHaveText('yes');
    await expect(testTaskPage.tabByName('Solution')).toBeVisible();

    // the task must NOT have been reloaded (no second task.load)
    const calls = await testTaskPage.getCalls();
    expect(calls.filter(entry => entry.method === 'task.load').length).toBe(1);
  });

  test('reloads an existing answer and state on load (v1/v2)', async ({ page }) => {
    await mockTestTaskItemApi(page, {
      taskQuery: 'apiVersion=1&minApiVersion=1',
      currentAnswer: { answer: '42', state: 'saved-state' },
    });
    await testTaskPage.gotoItem();
    await testTaskPage.waitForLoaded();

    const reloadAnswerCall = await testTaskPage.waitForCall('task.reloadAnswer');
    expect(reloadAnswerCall.params).toBe('42');
    const reloadStateCall = await testTaskPage.waitForCall('task.reloadState');
    expect(reloadStateCall.params).toBe('saved-state');
    await expect(testTaskPage.taskFrame.getByTestId('answer-input')).toHaveValue('42');
    await expect(testTaskPage.taskFrame.getByTestId('state-input')).toHaveValue('saved-state');
  });

  test('reloads an existing answer on load for v3 without savesHistory', async ({ page }) => {
    await mockTestTaskItemApi(page, {
      taskQuery: 'apiVersion=3&minApiVersion=1',
      currentAnswer: { answer: '42', state: 'saved-state' },
    });
    await testTaskPage.gotoItem();
    await testTaskPage.waitForLoaded();

    // Negotiated v3 uses the v2+ wire method (same as v2 tasks).
    const reloadAnswerCall = await testTaskPage.waitForCall('task.reloadAnswerWithOptions');
    expect(reloadAnswerCall.params).toEqual([ '42', {} ]);
    await expect(testTaskPage.taskFrame.getByTestId('answer-input')).toHaveValue('42');
  });

  test('does not reload a leftover current answer when v3 savesHistory is set', async ({ page }) => {
    await mockTestTaskItemApi(page, {
      taskQuery: 'apiVersion=3&minApiVersion=1&savesHistory=1',
      currentAnswer: { answer: '42', state: 'saved-state' },
    });
    await testTaskPage.gotoItem();
    await testTaskPage.waitForLoaded();
    await testTaskPage.waitForCall('task.load');

    // Flag is known after metadata; EmptyInitialAnswer must win over the leftover current answer.
    await expect(testTaskPage.taskFrame.getByTestId('answer-input')).toHaveValue('');
    const calls = await testTaskPage.getCalls();
    expect(calls.some(entry => entry.method === 'task.reloadAnswer')).toBe(false);
    expect(calls.some(entry => entry.method === 'task.reloadAnswerWithOptions')).toBe(false);
    expect(calls.some(entry => entry.method === 'task.reloadState')).toBe(false);
  });
  test('does not save a current answer on leave or submit when v3 savesHistory is set', async ({ page }) => {
    await mockTestTaskItemApi(page, {
      taskQuery: 'apiVersion=3&minApiVersion=1&savesHistory=1',
    });
    await testTaskPage.gotoItem();
    await testTaskPage.waitForLoaded();

    let currentAnswerPuts = 0;
    page.on('request', request => {
      if (request.method() === 'PUT' && /\/attempts\/[^/]+\/answers\/current/.test(request.url())) {
        currentAnswerPuts += 1;
      }
    });

    const saveGradeRequest = page.waitForRequest(
      request => request.url().includes('/items/save-grade') && request.method() === 'POST',
    );
    await testTaskPage.setAnswer('80');
    await testTaskPage.clickValidate('top');
    await saveGradeRequest;

    await testTaskPage.clearHostCalls();
    await page.locator('alg-left-tab-bar').getByRole('tab', { name: 'Groups' }).click();
    await expect(page).toHaveURL(/\/groups/, { timeout: 15000 });
    await testTaskPage.waitForHostCall('task.unload');

    expect(currentAnswerPuts).toBe(0);
  });

  test('still saves a current answer on leave when v3 does not set savesHistory', async ({ page }) => {
    await mockTestTaskItemApi(page, {
      taskQuery: 'apiVersion=3&minApiVersion=1',
    });
    await testTaskPage.gotoItem();
    await testTaskPage.waitForLoaded();

    const currentAnswerPut = page.waitForRequest(
      request => request.method() === 'PUT' && /\/attempts\/[^/]+\/answers\/current/.test(request.url()),
    );
    await testTaskPage.setAnswer('55');
    await page.locator('alg-left-tab-bar').getByRole('tab', { name: 'Groups' }).click();
    await currentAnswerPut;
    await expect(page).toHaveURL(/\/groups/, { timeout: 15000 });
  });

  test('View answer still reloads a submission read-only when v3 savesHistory is set', async ({ page }) => {
    await mockTestTaskItemApi(page, {
      taskQuery: 'apiVersion=3&minApiVersion=1&savesHistory=1',
      submission: { id: 'sub-answer-1', answer: '77', state: 'submitted-state' },
    });
    await testTaskPage.gotoAnswer('sub-answer-1');
    await testTaskPage.waitForLoaded();

    const reloadAnswerCall = await testTaskPage.waitForCall('task.reloadAnswerWithOptions');
    expect(reloadAnswerCall.params).toEqual([ '77', { idUserAnswer: 'sub-answer-1' } ]);
    await expect(testTaskPage.taskFrame.getByTestId('answer-input')).toHaveValue('77');
  });

  test('restarts the task from scratch when item.url changes after refresh', async ({ page, itemContentPage }) => {
    test.setTimeout(60_000); // load + parameters save + awaited unload + second handshake
    const versionedUrl = `${TEST_TASK_URL}?version=1`;
    await mockTestTaskItemApi(page, { canEdit: 'all' });
    await testTaskPage.gotoItem();
    await testTaskPage.waitForLoaded();
    await testTaskPage.waitForCall('task.load');
    await testTaskPage.clearHostCalls();

    await mockTestTaskItemApi(page, { canEdit: 'all', taskUrl: versionedUrl });
    await itemContentPage.openParametersTab();
    await expect(page).toHaveURL(/\/parameters/);
    await expect(page.getByTestId('allow-multiple-attempts')).toBeVisible();
    await page.getByTestId('allow-multiple-attempts').locator('alg-switch').click();
    await itemContentPage.saveChangesAndCheckNotification();

    await testTaskPage.waitForHostCall('task.unload');

    // Item refresh resets advertised task views, so the tab is Content until the new instance loads.
    const taskTab = page.getByRole('link', { name: 'Content' }).or(page.getByRole('link', { name: 'Statement' }));
    await expect(taskTab).toBeVisible();
    await taskTab.click();
    await testTaskPage.waitForLoaded();
    await testTaskPage.waitForCall('task.load');
    await expect(testTaskPage.taskIframeLocator()).toHaveAttribute('src', /[?&]version=1(?:&|$)/);
    await expect(page.locator('alg-item-display alg-error')).toHaveCount(0);
    await expect(page.getByText('cannot change task config')).toHaveCount(0);
    await expect(page.locator('.sentry-error-embed')).toHaveCount(0);
  });

  test('calls task.unload when leaving the task', async ({ page }) => {
    await testTaskPage.gotoItem();
    await testTaskPage.waitForLoaded();
    await testTaskPage.clearHostCalls();

    // In-app leave runs BeforeUnloadGuard → save then awaited teardown while the iframe is mounted.
    // Full page.goto only gets best-effort window beforeunload and does not reliably deliver unload.
    await page.locator('alg-left-tab-bar').getByRole('tab', { name: 'Groups' }).click();
    await expect(page).toHaveURL(/\/groups/, { timeout: 15000 });
    await testTaskPage.waitForHostCall('task.unload');
  });

  test.describe('History Events & Edits', () => {
    const submissionBetweenCheckpoints = [{
      at: '2024-06-01T10:01:30Z',
      activity_type: 'submission',
      attempt_id: '0',
      answer_id: 'ans-between',
      participant: { id: '1', name: 'test-user', type: 'User' },
      item: {
        id: TEST_TASK_ITEM_ID,
        type: 'Task',
        string: { title: 'Platform-task test task' },
      },
      score: 80,
      can_watch_answer: true,
    }];

    test('defaults to Events & Edits with a submission between two checkpoints', async ({ page }) => {
      await mockTestTaskItemApi(page, { taskQuery: 'apiVersion=3&minApiVersion=1&savesHistory=1' });
      await page.route(`${apiUrl}/items/${TEST_TASK_ITEM_ID}/log*`, async route => {
        const url = new URL(route.request().url());
        if (url.searchParams.get('attempt_id') === '0') {
          await route.fulfill({ json: submissionBetweenCheckpoints });
          return;
        }
        await route.fulfill({ json: submissionBetweenCheckpoints });
      });

      await testTaskPage.gotoItem();
      await testTaskPage.waitForLoaded();
      await page.getByRole('link', { name: 'History' }).click();
      await expect(page).toHaveURL(/\/history/);

      const selection = page.getByTestId('selection-control-value');
      await expect(selection).toHaveCount(2);
      await expect(selection.filter({ hasText: 'Events & Edits' })).toHaveClass(/active/);
      await expect(selection.filter({ hasText: 'Events & Edits of attempt' })).toHaveCount(0);

      await testTaskPage.waitForCall('task.getHistory');
      const captions = page.locator('.item-title-caption');
      await expect(captions).toHaveCount(3);
      await expect(captions.nth(0)).toContainText('Manual');
      await expect(captions.nth(1)).toContainText('Submission');
      await expect(captions.nth(2)).toContainText('Start');
      await expect(page.getByRole('link', { name: 'View answer' })).toBeVisible();
    });

    test('labels Events & Edits with the attempt number when there are several attempts', async ({ page }) => {
      await mockTestTaskItemApi(page, {
        taskQuery: 'apiVersion=3&minApiVersion=1&savesHistory=1',
        attempts: [
          { id: '0', started_at: '2024-01-01T00:00:00Z' },
          { id: '1', started_at: '2024-02-01T00:00:00Z' },
        ],
      });
      await page.route(`${apiUrl}/items/${TEST_TASK_ITEM_ID}/log*`, route => route.fulfill({ json: [] }));

      await testTaskPage.gotoItem();
      await testTaskPage.waitForLoaded();
      await page.getByRole('link', { name: 'History' }).click();
      await expect(page).toHaveURL(/\/history/);
      await expect(page.getByTestId('selection-control-value').filter({ hasText: 'Events & Edits of attempt #1' }))
        .toBeVisible();
    });

    test('Load more fetches a second page without reordering already-visible rows', async ({ page }) => {
      // Few events (first page exhausts them) and many checkpoints so Load more must
      // page getHistory with maxId while the activity-log stream is already done.
      const historySeedBase = Date.parse('2024-06-01T10:00:00Z');
      const logRows = Array.from({ length: 5 }, (_, index) => {
        const n = 5 - index;
        return {
          at: new Date(historySeedBase + (20 + n) * 60 * 1000).toISOString(),
          activity_type: 'submission',
          attempt_id: '0',
          answer_id: `ans-${n}`,
          participant: { id: '1', name: 'test-user', type: 'User' },
          item: {
            id: TEST_TASK_ITEM_ID,
            type: 'Task',
            string: { title: 'Platform-task test task' },
          },
          score: 80,
          can_watch_answer: true,
        };
      });

      await mockTestTaskItemApi(page, {
        taskQuery: 'apiVersion=3&minApiVersion=1&savesHistory=1&historyCheckpoints=25',
      });
      await page.route(`${apiUrl}/items/${TEST_TASK_ITEM_ID}/log*`, async route => {
        const url = new URL(route.request().url());
        const limit = Number(url.searchParams.get('limit') || '20');
        let start = 0;
        const fromAnswerId = url.searchParams.get('from.answer_id');
        if (fromAnswerId) {
          const idx = logRows.findIndex(row => row.answer_id === fromAnswerId);
          start = idx >= 0 ? idx + 1 : logRows.length;
        }
        await route.fulfill({ json: logRows.slice(start, start + limit) });
      });

      await testTaskPage.gotoItem();
      await testTaskPage.waitForLoaded();
      await page.getByRole('link', { name: 'History' }).click();
      await expect(page).toHaveURL(/\/history/);
      await testTaskPage.waitForCall('task.getHistory');

      const captions = page.locator('.item-title-caption');
      const firstCaptionBefore = await captions.first().textContent();
      const countBefore = await captions.count();
      expect(countBefore).toBeGreaterThan(0);

      const loadMore = page.getByRole('button', { name: 'Load more' });
      await expect(loadMore).toBeVisible();
      await loadMore.click();

      await testTaskPage.waitForCall(
        'task.getHistory',
        entry => (entry.params as { maxId?: number }).maxId !== undefined,
      );

      await expect.poll(async () => captions.count()).toBeGreaterThan(countBefore);
      await expect(captions.first()).toHaveText(firstCaptionBefore ?? '');
    });
  });

  test.describe('device proxy', () => {
    test.skip(({ browserName }) => browserName !== 'chromium', 'device proxy: chromium only');

    test('bluetooth requestDevice round-trips through platform.deviceProxy', async () => {
      await testTaskPage.gotoItem();
      await testTaskPage.waitForLoaded();

      await testTaskPage.clickBluetoothRequestDevice();

      await testTaskPage.waitForPlatformCall('platform.deviceProxy');
      await expect(testTaskPage.taskFrame.getByTestId('bluetooth-result')).not.toHaveText('pending…', { timeout: 15000 });
      const result = await testTaskPage.taskFrame.getByTestId('bluetooth-result').textContent();
      expect(result).toMatch(/^(ok:|error:)/);
    });

    test('websocket connect routes close/error events back to the task', async () => {
      await testTaskPage.gotoItem();
      await testTaskPage.waitForLoaded();

      await testTaskPage.clickWebSocketConnect();

      await testTaskPage.waitForPlatformCall('platform.deviceProxy');
      await testTaskPage.waitForCall('task.deviceProxy', entry => {
        const params = entry.params as [string, string, unknown];
        return params[0] === 'websocket' && params[1] === 'event';
      });
      await expect(testTaskPage.taskFrame.getByTestId('websocket-result')).not.toHaveText('pending…', { timeout: 15000 });
      const result = await testTaskPage.taskFrame.getByTestId('websocket-result').textContent();
      expect(result).toMatch(/^(close:|error)/);
    });
  });
});
