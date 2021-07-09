/**
 * Cross-domain task proxy implementation for Bebras task API in TypeScript
 * Adapted from task-xd-pr.js from https://github.com/France-ioi/pem-platform/
 *
 * It depends on jschannel.
 */

import { interval, Observable } from "rxjs";
import { filter, map, switchMap, take } from "rxjs/operators";
import { CompleteFunction, ErrorFunction, rxBuild, RxMessagingChannel } from "./rxjschannel";

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

function getUrlParameterByName(name : string, url : string) : string {
  const regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(url);
  return results && results[1] ? decodeURIComponent(results[1].replace(/\+/g, " ")) : "";
}

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
 * Task object, created from an iframe DOM element
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
    this.chan.bind('platform.validate', function (trans, mode : string) {
      platform.validate(mode, trans.complete, trans.error);
      trans.delayReturn(true);
    });
    this.chan.bind('platform.getTaskParams', function (trans, keyDefault? : [string, TaskParamsValue]) {
      const key = keyDefault ? keyDefault[0] : undefined;
      const defaultValue = keyDefault ? keyDefault[1] : undefined;
      platform.getTaskParams(key, defaultValue, trans.complete, trans.error);
      trans.delayReturn(true);
    });
    this.chan.bind('platform.showView', function (trans, view : TaskView) {
      platform.showView(view, trans.complete, trans.error);
      trans.delayReturn(true);
    });
    this.chan.bind('platform.askHint', function (trans, hintToken : string) {
      platform.askHint(hintToken, trans.complete, trans.error);
      trans.delayReturn(true);
    });
    this.chan.bind('platform.updateDisplay', function (trans, data : TaskDisplayData) {
      platform.updateDisplay(data, trans.complete, trans.error);
      trans.delayReturn(true);
    });
    this.chan.bind('platform.openUrl', function (trans, url : string) {
      platform.openUrl(url, trans.complete, trans.error);
      trans.delayReturn(true);
    });
    this.chan.bind('platform.log', function (trans, data : TaskLog) {
      platform.log(data, trans.complete, trans.error);
      trans.delayReturn(true);
    });

    // Legacy calls
    this.chan.bind('platform.updateHeight', function (trans, height : number) {
      platform.updateDisplay({ height: height }, trans.complete, trans.error);
      trans.delayReturn(true);
    });

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
    // TODO: validator
    return this.chan.call({
      method: "task.getHeight",
      timeout: 500,
    });
  }

  updateToken(token : string) : Observable<void> {
    return this.chan.call({
      method: "task.updateToken",
      params: token,
      timeout: 10000,
    });
  }

  getMetaData() : Observable<TaskMetaData> {
    // TODO: validator
    return this.chan.call({
      method: "task.getMetaData",
      timeout: 2000
    });
  }

  getAnswer() : Observable<string> {
    // TODO: validator
    return this.chan.call({
      method: "task.getAnswer",
      timeout: 2000
    });
  }

  reloadAnswer(answer : string) : Observable<void> {
    return this.chan.call({
      method: "task.reloadAnswer",
      params: answer,
      timeout: 2000
    });
  }

  getState() : Observable<string> {
    // TODO: validator
    return this.chan.call({
      method: "task.getState",
      timeout: 2000
    });
  }

  reloadState(state : string) : Observable<void> {
    return this.chan.call({
      method: "task.reloadState",
      params: state,
      timeout: 2000
    });
  }

  getViews() : Observable<TaskViews> {
    // TODO: validator
    return this.chan.call({
      method: "task.getViews",
      timeout: 2000
    });
  }

  showViews(views : Object) : Observable<void> {
    return this.chan.call({
      method: "task.showViews",
      params: views,
      timeout: 2000
    });
  }

  gradeAnswer(answer : string, answerToken : string) : Observable<TaskGrade> {
    // TODO: validator
    return this.chan.call({
      method: "task.gradeAnswer",
      params: [ answer, answerToken ],
      timeout: 40000
    });
  }

  getResources() : Observable<TaskResources> {
    // TODO: validator
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

  validate(_mode : string, _success : CompleteFunction<void>, error : ErrorFunction) : void {
    // TODO: validator
    error('platform.validate is not defined');
  }
  showView(_views : any, _success : CompleteFunction<void>, error : ErrorFunction) : void {
    // TODO: validator
    error('platform.validate is not defined');
  }
  askHint(_platformToken : string, _success : CompleteFunction<string>, error : ErrorFunction) : void {
    // TODO: validator
    error('platform.validate is not defined');
  }
  updateHeight(height : number, success : CompleteFunction<void>, error : ErrorFunction) : void {
    // TODO: validator
    this.updateDisplay({ height: height }, success, error);
  }
  updateDisplay(_data : UpdateDisplayParams, _success : CompleteFunction<void>, error? : ErrorFunction) : void {
    // TODO: validator
    if (error) {
      error('platform.updateDisplay is not defined!');
    }
  }
  openUrl(_url : string, _success : CompleteFunction<void>, error? : ErrorFunction) : void {
    // TODO: validator
    if (error) {
      error('platform.openUrl is not defined!');
    }
  }
  log(_data : TaskLog, _success : CompleteFunction<void>, error? : ErrorFunction) : void {
    // TODO: validator
    if (error){
      error('platform.log is not defined!');
    }
  }
  getTaskParams(key : string | undefined, defaultValue : TaskParamsValue,
    // TODO: validator
    success : (result : TaskParamsValue) => void, _? : ErrorFunction) : void {
    const res : {[key: string]: TaskParamsValue} = { minScore: -3, maxScore: 10, randomSeed: 0, noScore: 0, readOnly: false, options: {} };
    if (key) {
      if (key !== 'options' && key in res) {
        return success(res[key]);
      } else {
        return success(defaultValue);
      }
    }
    success(res);
  }
}
