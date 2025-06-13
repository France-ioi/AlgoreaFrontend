/**
 * Cross-domain task proxy implementation for Bebras task API in TypeScript
 * Adapted from task-xd-pr.js from https://github.com/France-ioi/pem-platform/
 *
 * It depends on jschannel.
 */

import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, retry } from 'rxjs/operators';
import { rxBuild, RxMessagingChannel } from './rxjschannel';
import {
  OpenUrlParams,
  openUrlParamsSchema,
  TaskGrade,
  taskGradeSchema,
  TaskLog,
  taskLogSchema,
  TaskMetaData,
  taskMetadataSchema,
  TaskParamsKeyDefault,
  taskParamsKeyDefaultSchema,
  TaskParamsValue,
  TaskResources,
  TaskViews,
  taskViewsSchema,
  UpdateDisplayParams,
  updateDisplayParamsSchema,
} from './types';
import { z } from 'zod/v4';

function getRandomID(): string {
  const low = Math.floor(Math.random() * 922337203).toString();
  const high = Math.floor(Math.random() * 2000000000).toString();
  return high + low;
}

/** Get URL for a task with specific parameters */
export function taskUrlWithParameters(taskUrl: string, platform: string, prefix = '', locale?: string): string {
  const channelId = prefix + getRandomID();
  const url = new URL(taskUrl);

  url.searchParams.set('sPlatform', platform);
  url.searchParams.set('channelId', channelId);
  if (locale) url.searchParams.set('sLocale', locale);

  return url.href;
}

/** Get Task object from an iframe */
export function taskProxyFromIframe(iframe : HTMLIFrameElement): Observable<Task> {
  return new Observable<Window>(observer => {
    if (iframe.contentWindow) {
    // Get contentWindow when it exists
      observer.next(iframe.contentWindow);
      observer.complete();
    } else observer.error(new Error('contentWindow not set for iframe'));
  }).pipe(
    // Check every 100ms whether the iframe loaded, for 5 minutes
    retry({
      delay: 100,
      count: 3000,
    }),
    // Get the RxMessagingChannel from the contentWindow
    switchMap(window => rxBuild({
      window,
      origin: '*',
      scope: new URL(iframe.src).searchParams.get('channelId') || '',
    })),

    // Get the Task from the channel
    map((chan: RxMessagingChannel) => new Task(chan))
  );
}


/**
 * Task object, created from a RxMessagingChannel
 */
export class Task {
  private platformSet = false;

  constructor(private chan: RxMessagingChannel) {}

  destroy(): void {
    this.chan.destroy();
  }

  bindPlatform(platform: TaskPlatform): void {
    if (this.platformSet) throw new Error('Task already has a platform set');

    this.chan.bind(
      'platform.validate',
      mode => platform.validate(z.string().parse(mode)),
    );

    this.chan.bind(
      'platform.getTaskParams',
      params => {
        const [ key, defaultValue ] = (Array.isArray(params) ? params : []) as unknown[];
        return platform.getTaskParams(taskParamsKeyDefaultSchema.parse({
          key: key ?? undefined,
          defaultValue: defaultValue ?? undefined,
        }));
      }
    );
    this.chan.bind(
      'platform.showView',
      view => platform.showView(z.string().parse(view)),
    );
    this.chan.bind(
      'platform.askHint',
      hintToken => platform.askHint(z.string().parse(hintToken)),
    );
    this.chan.bind(
      'platform.updateDisplay',
      data => platform.updateDisplay(updateDisplayParamsSchema.parse(data)),
    );
    this.chan.bind(
      'platform.openUrl',
      url => platform.openUrl(openUrlParamsSchema.parse(url)),
    );
    this.chan.bind(
      'platform.log',
      data => platform.log(taskLogSchema.parse(data)),
    );

    // Legacy calls
    this.chan.bind(
      'platform.updateHeight',
      height => platform.updateDisplay({ height: z.number().parse(height) }),
    );
    this.platformSet = true;
  }

  /**
   * Task API functions
   */
  load(views: object): Observable<unknown> {
    return this.chan.call({
      method: 'task.load',
      params: views,
    });
  }

  unload(): Observable<unknown> {
    return this.chan.call({
      method: 'task.unload',
      timeout: 2000,
    });
  }

  getHeight(): Observable<number> {
    return this.chan.call({
      method: 'task.getHeight',
      timeout: 500,
    }).pipe(map(([ height ]) => z.number().parse(height)));
  }

  updateToken(token: string): Observable<unknown> {
    return this.chan.call({
      method: 'task.updateToken',
      params: token,
      timeout: 10000,
    });
  }

  getMetaData(): Observable<TaskMetaData> {
    return this.chan.call({
      method: 'task.getMetaData',
      timeout: 2000,
    }).pipe(map(([ metadata ]) => taskMetadataSchema.parse(metadata)));
  }

  getAnswer(): Observable<string> {
    return this.chan.call({
      method: 'task.getAnswer',
      timeout: 2000
    }).pipe(
      map(([ answer ]) => z.string().parse(answer)),
      catchError(() => of('')),
    );
  }

  reloadAnswer(answer: string): Observable<unknown> {
    return this.chan.call({
      method: 'task.reloadAnswer',
      params: answer,
      timeout: 2000
    });
  }

  getState(): Observable<string> {
    return this.chan.call({
      method: 'task.getState',
      timeout: 2000
    }).pipe(
      map(([ state ]) => z.string().parse(state)),
      catchError(() => of('')),
    );
  }

  reloadState(state: string): Observable<unknown> {
    return this.chan.call({
      method: 'task.reloadState',
      params: state,
      timeout: 2000
    });
  }

  getViews(): Observable<TaskViews> {
    return this.chan.call({
      method: 'task.getViews',
      timeout: 2000
    }).pipe(map(([ taskViews ]) => taskViewsSchema.parse(taskViews)));
  }

  showViews(views: Record<string, boolean>): Observable<unknown> {
    return this.chan.call({
      method: 'task.showViews',
      params: views,
      timeout: 2000
    });
  }

  gradeAnswer(answer: string, answerToken: string): Observable<TaskGrade> {
    return this.chan.call({
      method: 'task.gradeAnswer',
      params: [ answer, answerToken ],
      timeout: 300000 // 5 min, same as the taskgrader timeout
    }).pipe(
      map(result => {
        if (result.length === 0) throw new Error('task.gradeAnswer returned no arguments');
        const [ score, message, scoreToken ] = (Array.isArray(result[0]) ? result[0] : result) as unknown[];
        return { score, message, scoreToken };
      }),
      map(taskGrade => taskGradeSchema.parse(taskGrade)),
    );
  }

  getResources() : Observable<TaskResources> {
    // TODO: validator (currently unused)
    return this.chan.call({
      method: 'task.getResources',
      params: [],
      timeout: 2000
    });
  }
}

export interface TaskPlatform {
  /*
   * Simple prototypes for Bebras platform API functions, to be overriden by your
   * "platform"'s specific functions (for each platform object).
   */
  validate(mode: string): Observable<void>,
  showView(views: string): void,
  askHint(hintToken: string): Observable<void>,
  updateHeight(height: number): void,
  updateDisplay(data: UpdateDisplayParams): void,
  openUrl(url: OpenUrlParams): void,
  log(data: TaskLog): void,
  getTaskParams(keyAndDefaultValue: TaskParamsKeyDefault): Observable<TaskParamsValue>,
}
