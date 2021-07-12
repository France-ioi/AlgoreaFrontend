/**
 * Cross-domain task proxy implementation for Bebras task API in TypeScript
 * Adapted from task-xd-pr.js from https://github.com/France-ioi/pem-platform/
 *
 * It depends on jschannel.
 */

import { interval, Observable, of, throwError } from "rxjs";
import { filter, map, switchMap, take } from "rxjs/operators";
import { rxBuild, RxMessagingChannel } from "./rxjschannel";
import * as D from 'io-ts/Decoder';

// Parameters passed to the task
export const taskParamsDecoder = D.struct({
  minScore: D.number,
  maxScore: D.number,
  noScore: D.number,
  randomSeed: D.number,
  readOnly: D.boolean,
  options: D.UnknownRecord,
});
export type TaskParams = D.TypeOf<typeof taskParamsDecoder>;

// Type returned by getTaskParams
export const taskParamsValueDecoder = D.union(taskParamsDecoder, D.UnknownRecord, D.string, D.number, D.boolean);
export type TaskParamsValue = D.TypeOf<typeof taskParamsValueDecoder> | undefined;

// Views offered by the task
// For instance, taskViews = { task: { includes: ["editor"] }, solution : {}}
export const taskViewDecoder = D.partial({
  requires: D.string,
  includes: D.array(D.string)
});
export type TaskView = D.TypeOf<typeof taskViewDecoder>;

export const taskViewsDecoder = D.record(taskViewDecoder);
export type TaskViews = D.TypeOf<typeof taskViewsDecoder>;

// Task grading results
export interface RawTaskGrade {
  score?: unknown,
  message?: unknown,
  scoreToken?: unknown
}
const taskGradeDecoder = D.partial({
  score: D.number,
  message: D.string,
  scoreToken: D.string,
});
export type TaskGrade = D.TypeOf<typeof taskGradeDecoder>;

// Parameters sent by the task to platform.updateDisplay
export const updateDisplayParamsDecoder = D.partial({
  height: D.number,
  views: taskViewsDecoder,
  scrollTop: D.number
});
export type UpdateDisplayParams = D.TypeOf<typeof updateDisplayParamsDecoder>;

// Log data sent by the task
export const taskLogDecoder = D.array(D.string);
export type TaskLog = D.TypeOf<typeof taskLogDecoder>;

// Currently unused
export type TaskMetaData = any;
export type TaskResources = any;


/** Get a parameter 'name' from the URL 'url' */
function getUrlParameterByName(name : string, url : string) : string {
  const regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(url);
  return results && results[1] ? decodeURIComponent(results[1].replace(/\+/g, " ")) : "";
}

/** Get a random ID (used by the channel name) */
function getRandomID(): string {
  const low = Math.floor(Math.random() * 922337203).toString();
  const high = Math.floor(Math.random() * 2000000000).toString();
  return high + low;
}

/** Get URL for a task with specific parameters */
export function getTaskUrl(taskUrl : string, token : string, platform : string, prefix? : string, locale? : string) : string {
  const channelId = (prefix || '') + getRandomID();
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
export function getTaskProxy(iframe : HTMLIFrameElement): Observable<Task> {
  // Check every second whether the iframe loaded
  return interval(1000)
    .pipe(
      // Abort after 300 seconds
      map(
        n => {
          if (n > 300) {
            throw Error("IFrame load waiting timeout");
          }
          return n;
        }
      ),

      // Get contentWindow when it exists
      filter(_ => !!iframe.contentWindow),
      take(1),
      map(_ => iframe.contentWindow as Window),

      // Get the RxMessagingChannel from the contentWindow
      switchMap((contentWindow: Window) =>
        rxBuild({
          window: contentWindow,
          origin: "*",
          scope: getUrlParameterByName('channelId', iframe.src),
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
  platformSet = false;;
  chan: RxMessagingChannel;

  constructor(chan: RxMessagingChannel) {
    this.chan = chan;
  }

  destroy(): void {
    this.chan.destroy();
  }

  setPlatform(platform : Platform): void {
    if (this.platformSet) {
      throw new Error("Task already has a platform set");
    }
    this.chan.bind(
      'platform.validate',
      (mode: string) => platform.validate(mode),
      D.string
    );
    // TODO validator
    this.chan.bind('platform.getTaskParams', (keyDefault? : [string, TaskParamsValue]) => platform.getTaskParams(keyDefault));
    this.chan.bind(
      'platform.showView',
      (view : string) => platform.showView(view),
      D.string
    );
    this.chan.bind(
      'platform.askHint',
      (hintToken : string) => platform.askHint(hintToken),
      D.string
    );
    this.chan.bind(
      'platform.updateDisplay',
      (data : UpdateDisplayParams) => platform.updateDisplay(data),
      updateDisplayParamsDecoder
    );
    this.chan.bind(
      'platform.openUrl',
      (url : string) => platform.openUrl(url),
      D.string
    );
    this.chan.bind(
      'platform.log',
      (data : TaskLog) => platform.log(data),
      taskLogDecoder
    );

    // Legacy calls
    this.chan.bind(
      'platform.updateHeight',
      (height : number) => platform.updateDisplay({ height: height }),
      D.number
    );
  }

  /**
   * Task API functions
   */
  load(views : Object): Observable<void> {
    return this.chan.call({
      method: "task.load",
      params: views,
    });
  }

  unload() : Observable<void> {
    return this.chan.call({
      method: "task.unload",
      timeout: 2000,
    });
  }

  getHeight() : Observable<number> {
    return this.chan.call({
      method: "task.getHeight",
      timeout: 500,
    }, D.number);
  }

  updateToken(token : string) : Observable<void> {
    return this.chan.call({
      method: "task.updateToken",
      params: token,
      timeout: 10000,
    });
  }

  getMetaData() : Observable<TaskMetaData> {
    // TODO: validator (currently unused)
    return this.chan.call({
      method: "task.getMetaData",
      timeout: 2000
    });
  }

  getAnswer() : Observable<string> {
    return this.chan.call({
      method: "task.getAnswer",
      timeout: 2000
    }, D.string);
  }

  reloadAnswer(answer : string) : Observable<void> {
    return this.chan.call({
      method: "task.reloadAnswer",
      params: answer,
      timeout: 2000
    });
  }

  getState() : Observable<string> {
    return this.chan.call({
      method: "task.getState",
      timeout: 2000
    }, D.string);
  }

  reloadState(state : string) : Observable<void> {
    return this.chan.call({
      method: "task.reloadState",
      params: state,
      timeout: 2000
    });
  }

  getViews() : Observable<TaskViews> {
    return this.chan.call({
      method: "task.getViews",
      timeout: 2000
    }, taskViewsDecoder);
  }

  showViews(views : Object) : Observable<void> {
    return this.chan.call({
      method: "task.showViews",
      params: views,
      timeout: 2000
    });
  }

  gradeAnswer(answer : string, answerToken : string) : Observable<TaskGrade> {
    function convertToTaskGrade(result: any[]) : RawTaskGrade {
      if (result.length == 0) {
        throw new Error('task.gradeAnswer returned no arguments');
      }
      const resultArray = Array.isArray(result[0]) ? result[0] : result;
      return {
        score: resultArray[0],
        message: resultArray[1],
        scoreToken: resultArray[2]
      };
    }
    return this.chan.call({
      method: "task.gradeAnswer",
      params: [ answer, answerToken ],
      selector: convertToTaskGrade,
      timeout: 40000
    }, taskGradeDecoder);
  }

  getResources() : Observable<TaskResources> {
    // TODO: validator (currently unused)
    return this.chan.call({
      method: "task.getResources",
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
    return throwError(() => new Error('platform.validate is not defined'));
  }
  showView(_view : string) : Observable<void> {
    return throwError(() => new Error('platform.showView is not defined'));
  }
  askHint(_platformToken : string) : Observable<void> {
    return throwError(() => new Error('platform.validate is not defined'));
  }
  updateHeight(height : number) : Observable<void> {
    return this.updateDisplay({ height: height });
  }
  updateDisplay(_data : UpdateDisplayParams) : Observable<void> {
    return throwError(() => new Error('platform.updateDisplay is not defined!'));
  }
  openUrl(_url : string) : Observable<void> {
    return throwError(() => new Error('platform.openUrl is not defined!'));
  }
  log(_data : TaskLog) : Observable<void> {
    return throwError(() => new Error('platform.log is not defined!'));
  }
  getTaskParams(keyDefault? : [string, TaskParamsValue]) : Observable<TaskParamsValue> {
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
