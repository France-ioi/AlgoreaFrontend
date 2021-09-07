/**
 * Cross-domain task proxy implementation for Bebras task API in TypeScript
 * Adapted from task-xd-pr.js from https://github.com/France-ioi/pem-platform/
 *
 * It depends on jschannel.
 */

import { Observable, of, throwError } from 'rxjs';
import { delay, map, retryWhen, switchMap, take } from 'rxjs/operators';
import { parseQueryString } from 'src/app/shared/helpers/url';
import { rxBuild, RxMessagingChannel } from './rxjschannel';
import * as D from 'io-ts/Decoder';
import {
  TaskGrade,
  taskGradeDecoder,
  TaskLog,
  taskLogDecoder,
  TaskMetaData,
  TaskParamsKeyDefault,
  taskParamsKeyDefaultDecoder,
  TaskParamsValue,
  TaskResources,
  TaskViews,
  taskViewsDecoder,
  UpdateDisplayParams,
  updateDisplayParamsDecoder,
} from './types';
import { decode } from 'src/app/shared/helpers/decoders';

function getRandomID(): string {
  const low = Math.floor(Math.random() * 922337203).toString();
  const high = Math.floor(Math.random() * 2000000000).toString();
  return high + low;
}

/** Get URL for a task with specific parameters */
export function taskUrlWithParameters(taskUrl : string, token : string, platform : string, prefix = '', locale? : string) : string {
  const channelId = prefix + getRandomID();
  if (taskUrl.indexOf('?') == -1) {
    // the idea is not to change the base url even if we change token, so we put token after #
    taskUrl = taskUrl + '?';
  } else {
    taskUrl = taskUrl + '&';
  }
  let url = taskUrl
      + 'sToken=' + encodeURIComponent(token)
      + '&sPlatform=' + encodeURIComponent(platform)
      + '&channelId=' + encodeURIComponent(channelId);
  if (locale) {
    url += '&sLocale=' + encodeURIComponent(locale);
  }
  return url;
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
    retryWhen(err => err.pipe(delay(100), take(3000))),

    // Get the RxMessagingChannel from the contentWindow
    switchMap((contentWindow: Window) =>
      rxBuild({
        window: contentWindow,
        origin: '*',
        scope: parseQueryString(iframe.src).get('channelId') || '',
      })
    ),

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
      mode => platform.validate(decode(D.string)(mode)),
    );

    this.chan.bind(
      'platform.getTaskParams',
      params => {
        const [ key, defaultValue ] = (Array.isArray(params) ? params : []) as unknown[];
        return platform.getTaskParams(decode(taskParamsKeyDefaultDecoder)({
          key: key ?? undefined,
          defaultValue: defaultValue ?? undefined,
        }));
      }
    );
    this.chan.bind(
      'platform.showView',
      view => platform.viewsShownByTask(decode(D.string)(view)),
    );
    this.chan.bind(
      'platform.askHint',
      hintToken => platform.askHint(decode(D.string)(hintToken)),
    );
    this.chan.bind(
      'platform.updateDisplay',
      data => platform.updateDisplay(decode(updateDisplayParamsDecoder)(data)),
    );
    this.chan.bind(
      'platform.openUrl',
      url => platform.openUrl(decode(D.string)(url)),
    );
    this.chan.bind(
      'platform.log',
      data => platform.log(decode(taskLogDecoder)(data)),
    );

    // Legacy calls
    this.chan.bind(
      'platform.updateHeight',
      height => platform.updateDisplay({ height: decode(D.number)(height) }),
    );
    this.platformSet = true;
  }

  /**
   * Task API functions
   */
  load(views: Object): Observable<unknown> {
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
    }).pipe(map(([ height ]) => decode(D.number)(height)));
  }

  updateToken(token: string): Observable<unknown> {
    return this.chan.call({
      method: 'task.updateToken',
      params: token,
      timeout: 10000,
    });
  }

  getMetaData(): Observable<TaskMetaData> {
    // TODO: validator (currently unused)
    return this.chan.call({
      method: 'task.getMetaData',
      timeout: 2000
    });
  }

  getAnswer(): Observable<string> {
    return this.chan.call({
      method: 'task.getAnswer',
      timeout: 2000
    }).pipe(map(([ answer ]) => decode(D.string)(answer)));
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
    }).pipe(map(([ state ]) => decode(D.string)(state)));
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
    }).pipe(map(([ taskViews ]) => decode(taskViewsDecoder)(taskViews)));
  }

  showViewsInTask(views: Object): Observable<unknown> {
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
      timeout: 40000
    }).pipe(
      map(result => {
        if (result.length === 0) throw new Error('task.gradeAnswer returned no arguments');
        const [ score, message, scoreToken ] = (Array.isArray(result[0]) ? result[0] : result) as unknown[];
        return { score, message, scoreToken };
      }),
      map(decode(taskGradeDecoder)),
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

export abstract class TaskPlatform {
  /*
   * Simple prototypes for Bebras platform API functions, to be overriden by your
   * "platform"'s specific functions (for each platform object).
   */
  validate(_mode: string): Observable<void> {
    return throwError(() => new Error('platform.validate is not defined'));
  }
  viewsShownByTask(_views: unknown): Observable<void> {
    return throwError(() => new Error('platform.showView is not defined'));
  }
  askHint(_platformToken: string): Observable<void> {
    return throwError(() => new Error('platform.validate is not defined'));
  }
  updateHeight(height: number): Observable<void> {
    return this.updateDisplay({ height });
  }
  updateDisplay(_data: UpdateDisplayParams): Observable<void> {
    return throwError(() => new Error('platform.updateDisplay is not defined!'));
  }
  openUrl(_url: string): Observable<void> {
    return throwError(() => new Error('platform.openUrl is not defined!'));
  }
  log(_data: TaskLog): Observable<void> {
    return throwError(() => new Error('platform.log is not defined!'));
  }
  getTaskParams({ key, defaultValue }: TaskParamsKeyDefault = {}): Observable<TaskParamsValue> {
    const res: Record<string, TaskParamsValue> = { minScore: -3, maxScore: 10, randomSeed: 0, noScore: 0, readOnly: false, options: {} };
    if (!key) return of(res);
    return key !== 'options' && key in res
      ? of(res[key])
      : of(defaultValue);
  }
}
