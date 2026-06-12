import { test, expect } from 'e2e/items/fixture';
import { initAsUsualUser } from 'e2e/helpers/e2e_auth';
import {
  mockTestTaskItemApi,
  routeTestTaskAssets,
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

  test('reloads an existing answer and state on load', async ({ page }) => {
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
});
