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

export interface TaskParams {
  minScore: number,
  maxScore: number,
  noScore: number,
  randomSeed: number,
  readOnly: boolean,
  options: Object,
}
export type TaskParamsValue = TaskParams | Object | string | number | undefined;

export interface UpdateDisplayParams {
  height?: number | string,
  views?: Object,
  scrollTop?: number,
}

// TODO : actual types
export type TaskMetaData = any;
export type TaskView = any;
export type TaskViews = any;
export type TaskGrade = any;
export type TaskResources = any;
export type TaskDisplayData = any;
export type TaskLog = any;

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

  bindPlatform(platform : Platform): void {
    if (this.platformSet) {
      throw new Error('Task already has a platform set');
    }
    this.chan.bind('platform.validate', (mode: string) => platform.validate(mode));
    this.chan.bind('platform.getTaskParams', (keyDefault? : [string, TaskParamsValue]) => platform.getTaskParams(keyDefault));
    this.chan.bind('platform.showView', (view : TaskView) => platform.viewsShownByTask(view));
    this.chan.bind('platform.askHint', (hintToken : string) => platform.askHint(hintToken));
    this.chan.bind('platform.updateDisplay', (data : TaskDisplayData) => platform.updateDisplay(data));
    this.chan.bind('platform.openUrl', (url : string) => platform.openUrl(url));
    this.chan.bind('platform.log', (data : TaskLog) => platform.log(data));

    // Legacy calls
    this.chan.bind('platform.updateHeight', (height : number) => platform.updateDisplay({ height: height }));
    this.platformSet = true;
  }

  /**
   * Task API functions
   */
  load(views : Object): Observable<void> {
    return this.chan.call({
      method: 'task.load',
      params: views,
    });
  }

  unload() : Observable<void> {
    return this.chan.call({
      method: 'task.unload',
      timeout: 2000,
    });
  }

  getHeight() : Observable<number> {
    // TODO: validator
    return this.chan.call({
      method: 'task.getHeight',
      timeout: 500,
    });
  }

  updateToken(token : string) : Observable<void> {
    return this.chan.call({
      method: 'task.updateToken',
      params: token,
      timeout: 10000,
    });
  }

  getMetaData() : Observable<TaskMetaData> {
    // TODO: validator
    return this.chan.call({
      method: 'task.getMetaData',
      timeout: 2000
    });
  }

  getAnswer() : Observable<string> {
    // TODO: validator
    return this.chan.call({
      method: 'task.getAnswer',
      timeout: 2000
    });
  }

  reloadAnswer(answer : string) : Observable<void> {
    return this.chan.call({
      method: 'task.reloadAnswer',
      params: answer,
      timeout: 2000
    });
  }

  getState() : Observable<string> {
    // TODO: validator
    return this.chan.call({
      method: 'task.getState',
      timeout: 2000
    });
  }

  reloadState(state : string) : Observable<void> {
    return this.chan.call({
      method: 'task.reloadState',
      params: state,
      timeout: 2000
    });
  }

  getViews() : Observable<TaskViews> {
    // TODO: validator
    return this.chan.call({
      method: 'task.getViews',
      timeout: 2000
    });
  }

  showViewsInTask(views : Object) : Observable<void> {
    return this.chan.call({
      method: 'task.showViews',
      params: views,
      timeout: 2000
    });
  }

  gradeAnswer(answer : string, answerToken : string) : Observable<TaskGrade> {
    // TODO: validator
    return this.chan.call({
      method: 'task.gradeAnswer',
      params: [ answer, answerToken ],
      timeout: 40000
    });
  }

  getResources() : Observable<TaskResources> {
    // TODO: validator
    return this.chan.call({
      method: 'task.getResources',
      params: [],
      timeout: 2000
    });
  }
}

/*
 * Platform object definition, created from a Task object (see below)
 */

export class Platform {
  task : Task;
  constructor(task : Task) {
    this.task = task;
  }

  getTask() : Task {
    return this.task;
  }

  /*
   * Simple prototypes for platform API functions, to be overriden by your
   * platform's specific functions (for each platform object)
   */

  validate(_mode : string) : Observable<void> {
    // TODO: validator
    return throwError(() => new Error('platform.validate is not defined'));
  }
  viewsShownByTask(_views : any) : Observable<void> {
    // TODO: validator
    return throwError(() => new Error('platform.showView is not defined'));
  }
  askHint(_platformToken : string) : Observable<void> {
    // TODO: validator
    return throwError(() => new Error('platform.validate is not defined'));
  }
  updateHeight(height : number) : Observable<void> {
    // TODO: validator
    return this.updateDisplay({ height: height });
  }
  updateDisplay(_data : UpdateDisplayParams) : Observable<void> {
    // TODO: validator
    return throwError(() => new Error('platform.updateDisplay is not defined!'));
  }
  openUrl(_url : string) : Observable<void> {
    // TODO: validator
    return throwError(() => new Error('platform.openUrl is not defined!'));
  }
  log(_data : TaskLog) : Observable<void> {
    // TODO: validator
    return throwError(() => new Error('platform.log is not defined!'));
  }
  getTaskParams(keyDefault? : [string, TaskParamsValue]) : Observable<TaskParamsValue> {
    // TODO: validator
    const key = keyDefault ? keyDefault[0] : undefined;
    const defaultValue = keyDefault ? keyDefault[1] : undefined;
    const res : {[key: string]: TaskParamsValue} = { minScore: -3, maxScore: 10, randomSeed: 0, noScore: 0, readOnly: false, options: {} };
    if (key) {
      if (key !== 'options' && key in res) {
        return of(res[key]);
      } else {
        return of(defaultValue);
      }
    }
    return of(res);
  }
}
