import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ItemData } from '../../services/item-datasource.service';
import { taskProxyFromIframe, taskUrlWithParameters, Task, } from 'src/app/modules/item/task-communication/task-proxy';
import { BehaviorSubject, concat, forkJoin, interval, Observable, of, Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, map, mapTo, switchMap, take, tap } from 'rxjs/operators';
import { UpdateDisplayParams } from '../../task-communication/types';
import { errorState, fetchingState, FetchState, readyState } from 'src/app/shared/helpers/state';
import { readyData } from 'src/app/shared/operators/state';
import { SECONDS } from 'src/app/shared/helpers/duration';
import { appConfig } from 'src/app/shared/helpers/config';
import { ItemTaskPlatform } from './task-platform';

const initialHeight = 400;
const heightSyncInterval = 0.2*SECONDS;
const answerAndStateSaveInterval = 1*SECONDS;

interface TaskTab {
  name: string
}

@Component({
  selector: 'alg-item-display',
  templateUrl: './item-display.component.html',
  styleUrls: [ './item-display.component.scss' ]
})
export class ItemDisplayComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() itemData?: ItemData;
  @ViewChild('iframe') iframe?: ElementRef<HTMLIFrameElement>;

  state$ = new BehaviorSubject<FetchState<Task>>(fetchingState());
  task$ = this.state$.pipe(readyData());
  display$ = new Subject<UpdateDisplayParams>();

  // Tabs displayed above the task
  // TODO get views from the task and make actual tabs
  activeTab: TaskTab = { name: 'Task' };
  tabs: TaskTab[] = [ this.activeTab ];

  // display of the iframe
  url?: SafeResourceUrl; // used by the iframe to load the task, set at view init
  height$ = concat(of(initialHeight), this.syncedHeight());

  private platform = new ItemTaskPlatform(this.task$, this.display$);

  private subscriptions = [
    this.registerTaskViewLoading(),
    this.registerRecurringAnswerAndStateSave()
  ];

  constructor(private sanitizer: DomSanitizer) {}

  // Lifecycle functions
  ngOnInit(): void {
    if (!this.itemData) throw new Error('itemData must be set in ItemDisplayComponent');

    const rawUrl = this.itemData.item.url;

    if (!rawUrl) {
      // TODO better behavior when there is no URL defined for the task?
      this.state$.next(errorState(new Error($localize`No URL defined for this task.`)));
      return;
    }
    // TODO get sToken
    const taskToken = '';
    // TODO get platformId from configuration
    const urlWithParams = taskUrlWithParameters(rawUrl, taskToken, appConfig.itemPlatformId, 'task-');
    this.url = this.sanitizer.bypassSecurityTrustResourceUrl(urlWithParams);
  }

  ngAfterViewInit(): void {
    // ngAfterViewInit waits for the ViewChild to be initialized
    if (!this.iframe) throw new Error('Expecting the iframe to exist');
    const iframe = this.iframe.nativeElement;
    this.loadTaskFromIframe(iframe);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.itemData && !changes.itemData.firstChange) throw new Error('This component does not support change of its itemData input');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());

    // destroy the task
    const state = this.state$.value;
    if (state.isReady) state.data.destroy();
  }

  /** Initializes a task once the URL has been loaded in the iframe */
  private loadTaskFromIframe(iframe: HTMLIFrameElement): void {
    taskProxyFromIframe(iframe).pipe(
      switchMap(task => {
        // Got task proxy from the iframe, ask task to load
        task.bindPlatform(this.platform);
        const initialViews = { task: true, solution: true, editor: true, hints: true, grader: true, metadata: true };
        return task.load(initialViews).pipe(mapTo(task));
      })
    ).subscribe({
      next: task => this.state$.next(readyState(task)),
      error: err => this.state$.next(errorState(err))
    });
  }

  /* Communication with the task */

  private registerTaskViewLoading(): Subscription {
    // Load views once the task has been loaded
    return this.state$.pipe(
      readyData(),
      switchMap(task => task.getViews().pipe(map(views => ({ task, views })))),
      tap(({ task: _, views }) => this.setTaskViews(views)),
      switchMap(({ task, views: _ }) => task.showViewsInTask({ task: true })),
    ).subscribe({
      error: err => this.state$.next(errorState(err))
    });
  }

  private syncedHeight(): Observable<number> {
    // Start updating the iframe height to match the task's height
    return this.state$.pipe(
      switchMap(s => interval(heightSyncInterval).pipe(mapTo(s))),
      readyData(),
      switchMap(task => task.getHeight()),
    );
  }

  private registerRecurringAnswerAndStateSave(): Subscription {
    // Automatically save the answer and state
    return this.state$.pipe(
      switchMap(s => interval(answerAndStateSaveInterval).pipe(mapTo(s))),
      readyData(),
      switchMap(task => forkJoin([
        task.getAnswer(),
        task.getState()
      ])),
      distinctUntilChanged(([ answer1, state1 ], [ answer2, state2 ]) => answer1 === answer2 && state1 === state2),
      /* TODO: save */
    ).subscribe();
  }

  reloadAnswerState(answer: string, state: string): void {
    this.state$.pipe(
      take(1),
      readyData(),
      switchMap(task => concat(task.reloadState(state), task.reloadAnswer(answer))),
    ).subscribe();
  }

  // Views management
  private setTaskViews(_views: any): void {
    // TODO
  }

  setActiveTab(tab: TaskTab): void {
    this.activeTab = tab;
  }
}
