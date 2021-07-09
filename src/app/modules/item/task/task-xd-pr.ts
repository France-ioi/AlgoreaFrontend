/**
 * Cross-domain task proxy implementation for Bebras task API in TypeScript
 * Adapted from task-xd-pr.js from https://github.com/France-ioi/pem-platform/
 *
 * It depends on jschannel.
 */

import { interval, Observable, Subscription } from "rxjs";
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

// TODO This TaskProxyManager was imported from the original task-xd-pr,
// but some aspects can probably be simplified
export class TaskProxyManager {
  task? : Task;
  platform? : Platform;
  checkInterval? : Subscription;
  chan? : RxMessagingChannel;
  nbSecs = 0;
  getRandomID(): string {
    const low = Math.floor(Math.random() * 922337203).toString();
    const high = Math.floor(Math.random() * 2000000000).toString();
    return high + low;
  }
  getTaskProxy(iframe : HTMLIFrameElement, success : (task: Task) => void, force : boolean, errorFun?: ErrorFunction): void {
    if (this.task && !force) {
      success(this.task);
    } else {
      if (force) {
        this.deleteTaskProxy();
      }
      const that = this;
      this.checkInterval = interval(1000).subscribe(function() {
        if (that.nbSecs > 300) {
          if (errorFun) {
            errorFun();
          }
          that.checkInterval?.unsubscribe();
        }
        that.nbSecs++;
        if (!iframe.contentWindow) {
          return;
        }
        that.checkInterval?.unsubscribe();
        that.chan = rxBuild({
          window: iframe.contentWindow,
          origin: "*",
          //      scope: "test",
          scope: that.getUrlParameterByName('channelId', iframe.src),
          onReady: () => {
            if (!that.chan) {
              return;
            }
            that.task = new Task(iframe, that.chan);
            if (that.platform) {
              that.task?.setPlatform(that.platform);
            }
            success(that.task);
          } });
      });
    }
  }
  getUrlParameterByName(name : string, url : string) : string {
    const regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(url);
    return results && results[1] ? decodeURIComponent(results[1].replace(/\+/g, " ")) : "";
  }
  setPlatform(task : Task, platform : Platform) : void {
    this.platform = platform;
    task?.setPlatform(platform);
  }
  deleteTaskProxy() : void {
    const task = this.task;
    if (task) {
      task.chan.destroy();
    }
    delete(this.task);
    delete(this.platform);
  }
  getUrl(taskUrl : string, sToken : string, sPlatform : string, prefix? : string, sLocale? : string) : string {
    const channelId = (prefix || '') + this.getRandomID();
    if (taskUrl.indexOf('?') == -1) {
      // the idea is not to change the base url even if we change token, so we put token after #
      taskUrl = taskUrl + '?';
    } else {
      taskUrl = taskUrl + '&';
    }
    let url = taskUrl
      + 'sToken=' + encodeURIComponent(sToken)
      + '&sPlatform=' + encodeURIComponent(sPlatform)
      + '&channelId=' + encodeURIComponent(channelId);
    if (sLocale) {
      url += '&sLocale=' + encodeURIComponent(sLocale);
    }
    return url;
  }
}

/*
 * Task object, created from an iframe DOM element
 */
export class Task {
  iframe: HTMLIFrameElement;
  taskId: string | null;
  platform?: Platform;
  platformSet: boolean;
  chan: RxMessagingChannel;

  constructor(iframe : HTMLIFrameElement, chan: RxMessagingChannel) {
    this.iframe = iframe;
    this.taskId = iframe.getAttribute('id');
    this.platformSet = false;
    this.chan = chan;
  }
  setPlatform(platform : Platform): void {
    const that = this;
    that.platform = platform;
    if (this.platformSet) {
      // in this case, the bound functions will call the new platform
      return;
    }
    this.chan.bind('platform.validate', function (trans, mode : string) {
      that.platform?.validate(mode, trans.complete, trans.error);
      trans.delayReturn(true);
    });
    this.chan.bind('platform.getTaskParams', function (trans, keyDefault? : [string, TaskParamsValue]) {
      const key = keyDefault ? keyDefault[0] : undefined;
      const defaultValue = keyDefault ? keyDefault[1] : undefined;
      that.platform?.getTaskParams(key, defaultValue, trans.complete, trans.error);
      trans.delayReturn(true);
    });
    this.chan.bind('platform.showView', function (trans, view : TaskView) {
      that.platform?.showView(view, trans.complete, trans.error);
      trans.delayReturn(true);
    });
    this.chan.bind('platform.askHint', function (trans, hintToken : string) {
      that.platform?.askHint(hintToken, trans.complete, trans.error);
      trans.delayReturn(true);
    });
    this.chan.bind('platform.updateDisplay', function (trans, data : TaskDisplayData) {
      that.platform?.updateDisplay(data, trans.complete, trans.error);
      trans.delayReturn(true);
    });
    this.chan.bind('platform.openUrl', function (trans, url : string) {
      that.platform?.openUrl(url, trans.complete, trans.error);
      trans.delayReturn(true);
    });
    this.chan.bind('platform.log', function (trans, data : TaskLog) {
      that.platform?.log(data, trans.complete, trans.error);
      trans.delayReturn(true);
    });
    this.platformSet = true;

    // Legacy calls
    this.chan.bind('platform.updateHeight', function (trans, height : number) {
      that.platform?.updateDisplay({ height: height }, trans.complete, trans.error);
      trans.delayReturn(true);
    });
  }

  getSourceId() : string {
    return this.taskId || '';
  }

  getTargetUrl() : string | null {
    return this.iframe.getAttribute('src');
  }

  getTarget() : HTMLIFrameElement["contentWindow"] {
    return this.iframe.contentWindow;
  }

  getDomain() : string {
    const url = this.getTargetUrl() || '';
    return url.substr(0, url.indexOf('/', 7));
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
  updateDisplay(data : UpdateDisplayParams, success : CompleteFunction<void>, _? : ErrorFunction) : void {
    // TODO: validator
    if (data.height !== undefined) {
      const height = Number(data.height);
      this.task.iframe.setAttribute('height', String(height + 40));
      success();
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
