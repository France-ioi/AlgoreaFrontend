import * as fs from 'fs';
import * as path from 'path';
import { expect, FrameLocator, Page } from '@playwright/test';
import { apiUrl } from 'e2e/helpers/e2e_http';

export const TEST_TASK_ITEM_ID = '9999999999999999001';
export const TEST_TASK_URL = 'http://localhost:4200/test-task/index.html';

export interface TestTaskApiOptions {
  itemId?: string,
  taskUrl?: string,
  taskQuery?: string,
  currentAnswer?: { answer: string, state: string } | null,
}

interface TaskCallLogEntry {
  method: string,
  params: unknown,
  timestamp: number,
}

const actionSuccess = { success: true as const, message: 'ok' };

function buildTaskResponse(itemId: string, taskUrl: string): object {
  return {
    id: itemId,
    type: 'Task',
    validation_type: 'All',
    requires_explicit_entry: false,
    allows_multiple_attempts: true,
    entry_participant_type: 'User',
    duration: null,
    no_score: false,
    default_language_tag: 'en',
    permissions: {
      can_view: 'content',
      can_grant_view: 'none',
      can_watch: 'none',
      can_edit: 'none',
      is_owner: true,
      can_request_help: true,
    },
    entry_min_admitted_members_ratio: 'None',
    entry_frozen_teams: false,
    entry_max_team_size: 0,
    prompt_to_join_group_by_code: false,
    text_id: null,
    read_only: false,
    children_layout: 'List',
    entering_time_min: '1000-01-01T00:00:00Z',
    entering_time_max: '9999-12-31T23:59:59Z',
    supported_language_tags: ['en'],
    best_score: 0,
    display_settings: {},
    string: {
      language_tag: 'en',
      title: 'Platform-task test task',
      image_url: null,
      subtitle: null,
      description: null,
      edu_comment: null,
    },
    url: taskUrl,
    options: '',
    uses_api: true,
    hints_allowed: false,
  };
}

export async function routeTestTaskAssets(page: Page): Promise<void> {
  const testTaskDir = path.join(__dirname, '../../../mocks/test-task');
  const jschannelPath = path.join(__dirname, '../../../node_modules/jschannel/src/jschannel.js');
  const contentTypes: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
  };

  await page.route('**/test-task/**', async route => {
    const url = new URL(route.request().url());
    const relativePath = url.pathname.replace(/^.*\/test-task\//, '') || 'index.html';
    if (relativePath === 'jschannel.js') {
      await route.fulfill({
        body: fs.readFileSync(jschannelPath),
        contentType: 'application/javascript',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
      return;
    }
    const filePath = path.join(testTaskDir, relativePath);
    const extension = path.extname(filePath);
    await route.fulfill({
      body: fs.readFileSync(filePath),
      contentType: contentTypes[extension] ?? 'text/plain',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
  });
}

export async function mockTestTaskItemApi(page: Page, options: TestTaskApiOptions = {}): Promise<void> {
  const itemId = options.itemId ?? TEST_TASK_ITEM_ID;
  const taskUrl = options.taskUrl ?? (
    options.taskQuery ? `${TEST_TASK_URL}?${options.taskQuery}` : TEST_TASK_URL
  );
  const taskResponse = buildTaskResponse(itemId, taskUrl);
  const breadcrumbs = [{
    item_id: itemId,
    language_tag: 'en',
    title: 'Platform-task test task',
    type: 'Task',
  }];
  const attempts = [{
    id: '0',
    created_at: '2024-01-01T00:00:00Z',
    score_computed: 0,
    validated: false,
    started_at: '2024-01-01T00:00:00Z',
    ended_at: null,
    allows_submissions_until: '9999-12-31T23:59:59Z',
    latest_activity_at: '2024-01-01T00:00:00Z',
    help_requested: false,
    user_creator: {
      login: 'test-user',
      first_name: null,
      last_name: null,
      group_id: '1',
    },
  }];

  await page.route(`${apiUrl}/items/${itemId}`, route => route.fulfill({ json: taskResponse }));
  await page.route(`${apiUrl}/items/${itemId}/breadcrumbs*`, route => route.fulfill({ json: breadcrumbs }));
  await page.route(`${apiUrl}/items/${itemId}/attempts*`, route => route.fulfill({ json: attempts }));
  await page.route(`${apiUrl}/items/${itemId}/current-answer*`, route => {
    if (route.request().method() === 'PUT') {
      route.fulfill({ json: actionSuccess });
      return;
    }
    if (options.currentAnswer) {
      route.fulfill({
        json: {
          answer: options.currentAnswer.answer,
          state: options.currentAnswer.state,
          attempt_id: '0',
          author_id: '1',
          participant_id: '1',
          id: 'answer-1',
          item_id: itemId,
          score: null,
          type: 'Current',
        },
      });
      return;
    }
    route.fulfill({ json: { type: null } });
  });
  await page.route(`${apiUrl}/items/${itemId}/attempts/*/generate-task-token`, route => route.fulfill({
    json: { ...actionSuccess, data: { task_token: 'mock-task-token' } },
  }));
  await page.route(`${apiUrl}/answers`, route => route.fulfill({
    json: { ...actionSuccess, data: { answer_token: 'mock-answer-token' } },
  }));
  await page.route(`${apiUrl}/items/save-grade`, route => {
    // mirror the backend: a submission validates the item once it reaches the max score
    const score = (route.request().postDataJSON() as { score?: number } | null)?.score ?? 0;
    route.fulfill({
      json: { ...actionSuccess, data: { validated: score >= 100, unlocked_items: [] } },
    });
  });
}

export class TestTaskPage {
  readonly taskFrame: FrameLocator = this.page.locator('alg-item-display iframe').contentFrame();

  constructor(private readonly page: Page) {}

  async gotoItem(itemId = TEST_TASK_ITEM_ID): Promise<void> {
    await this.page.goto(`/a/${itemId};p=;a=0`);
  }

  async waitForLoaded(): Promise<void> {
    await expect(this.page.getByText('Loading the content')).not.toBeVisible({ timeout: 30000 });
    await expect(this.taskFrame.getByTestId('test-task-status')).toHaveText('Ready', { timeout: 30000 });
    // Guard against the task script having crashed partway through setup (e.g. a missing DOM element):
    // the channel binds happen early, so the status can be "Ready" even if button handlers were never attached.
    const setupComplete = await this.taskFrame.locator('body')
      .evaluate(() => typeof window.invokePlatform === 'function');
    expect(setupComplete).toBe(true);
  }

  async getCalls(): Promise<TaskCallLogEntry[]> {
    return this.taskFrame.locator('body').evaluate(() => window.testTaskCalls ?? []);
  }

  async waitForCall(method: string, matches?: (entry: TaskCallLogEntry) => boolean): Promise<TaskCallLogEntry> {
    const isMatch = (entry: TaskCallLogEntry): boolean => entry.method === method && (!matches || matches(entry));
    await expect.poll(async () => {
      const calls = await this.getCalls();
      return calls.some(isMatch);
    }).toBe(true);
    const calls = await this.getCalls();
    return calls.find(isMatch)!;
  }

  async waitForPlatformCall(method: string): Promise<TaskCallLogEntry> {
    const outboundMethod = '→ ' + method;
    await expect.poll(async () => {
      const calls = await this.getCalls();
      return calls.some(entry => entry.method === outboundMethod || entry.method === '_outgoing.' + method);
    }, { timeout: 15000 }).toBe(true);
    const calls = await this.getCalls();
    return calls.find(entry => entry.method === outboundMethod)
      ?? calls.find(entry => entry.method === '_outgoing.' + method)!;
  }

  async setAnswer(value: string): Promise<void> {
    await this.taskFrame.getByTestId('answer-input').fill(value);
  }

  async clickValidate(mode = 'top'): Promise<void> {
    await this.taskFrame.getByTestId('validate-mode').selectOption(mode);
    await this.taskFrame.getByTestId('validate-btn').click();
  }

  async clickShowView(view: string): Promise<void> {
    await this.taskFrame.getByTestId('show-view').selectOption(view);
    await this.taskFrame.getByTestId('show-view-btn').click();
  }

  async invokeGetTaskParams(): Promise<void> {
    await this.taskFrame.getByTestId('get-task-params-btn').click();
  }

  async clickUpdateDisplay(height: number): Promise<void> {
    await this.taskFrame.getByTestId('display-height').fill(String(height));
    await this.taskFrame.getByTestId('update-display-btn').click();
  }

  async clickOpenUrl(itemId: string): Promise<void> {
    await this.taskFrame.getByTestId('open-url-target').fill(itemId);
    await this.taskFrame.getByTestId('open-url-btn').click();
  }

  taskIframeLocator() {
    return this.page.locator('alg-item-display iframe.iframe-element');
  }

  activeTab() {
    return this.page.locator('alg-tab-bar li.alg-tab-bar-active');
  }

  tabByName(name: string) {
    return this.page.locator('alg-tab-bar li', { hasText: name });
  }
}

declare global {
  interface Window {
    testTaskCalls?: TaskCallLogEntry[],
    testTaskState?: {
      answer: string,
      state: string,
      token: string,
      shownViews: Record<string, boolean>,
      loaded: boolean,
      solutionGranted: boolean,
    },
    invokePlatform?: (method: string, params: unknown) => Promise<unknown>,
  }
}
