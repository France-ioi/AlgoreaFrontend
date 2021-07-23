import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ItemData } from '../../services/item-datasource.service';
import { taskProxyFromIframe, taskUrlWithParameters, TaskListener, Task, TaskParams, TaskParamsValue }
  from 'src/app/modules/item/task-communication/task-proxy';
import { EMPTY, forkJoin, interval, Observable, of, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

interface TaskTab {
  name: string
}

@Component({
  selector: 'alg-item-display',
  templateUrl: './item-display.component.html',
  styleUrls: [ './item-display.component.scss' ]
})
export class ItemDisplayComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() itemData?: ItemData;
  @ViewChild('iframe') iframe?: ElementRef<HTMLIFrameElement>;

  state : 'loading' | 'loaded' | 'unloading';
  url? : SafeResourceUrl;
  msg = '';

  tabs: TaskTab[] = [];
  activeTab: TaskTab;

  task?: Task;
  platform? : TaskListener;

  height: number;
  heightInterval? : Subscription;

  lastAnswer = '';
  lastState = '';
  saveInterval? : Subscription;

  constructor(private sanitizer: DomSanitizer) {
    this.state = 'loading';
    this.height = 400;
    const initialTab = { name: 'Task' };
    this.tabs = [ initialTab ];
    this.tabs.push({ name: 'Editor' });
    this.activeTab = initialTab;
  }


  // Lifecycle functions
  ngOnInit(): void {
    const url = this.itemData?.item.url || '';
    // TODO get sToken
    const sToken = '';
    this.setUrl(taskUrlWithParameters(url, sToken, 'http://algorea.pem.dev', 'task-'));
  }

  ngAfterViewInit(): void {
    if (this.iframe) {
      const iframe = this.iframe.nativeElement;
      taskProxyFromIframe(iframe).subscribe((task: Task) => this.taskIframeLoaded(task));
    }
  }

  ngOnDestroy(): void {
    this.heightInterval?.unsubscribe();
    this.saveInterval?.unsubscribe();
    this.task?.destroy();
  }

  // Task iframe is ready
  taskIframeLoaded(task: Task): void {
    this.task = task;
    const taskParams = { minScore: -3, maxScore: 10, randomSeed: 0, noScore: 0, readOnly: false, options: {} };
    this.platform = new ItemDisplayPlatform(task, taskParams);
    this.task.bindPlatform(this.platform);

    const initialViews = { task: true, solution: true, editor: true, hints: true, grader: true, metadata: true };
    task.load(initialViews).subscribe(() => this.taskLoaded());
  }

  // task.load done
  taskLoaded(): void {
    this.state = 'loaded';

    this.updateHeight();
    this.heightInterval = interval(1000).subscribe(() => this.updateHeight());
    this.saveInterval = interval(1000).subscribe(() => this.getAnswerState());

    this.task?.showViewsInTask({ task: true }).subscribe(() => {});

    this.task?.getViews().subscribe((views : any) => {
      this.setViews(views);
    });
  }

  // Communication with the task
  getAnswerState(): void {
    if (!this.task) {
      return;
    }
    forkJoin([
      this.task.getAnswer(),
      this.task.getState()
    ]).subscribe(([ answer, state ]) => this.saveAnswerState(answer, state));
  }

  reloadAnswerState(answer : string, state : string): void {
    if (!this.task) {
      return;
    }
    const task = this.task;
    task.reloadAnswer(answer)
      .pipe(switchMap(() =>
        task.reloadState(state)
      ))
      .subscribe();
  }

  saveAnswerState(answer : string, state : string) : void {
    if (answer != this.lastAnswer || state != this.lastState) {
      // TODO Save
    }
    this.lastAnswer = answer;
    this.lastState = state;
  }

  updateHeight(): void {
    this.task?.getHeight().subscribe(height => this.setHeight(height));
  }

  // Views management
  setViews(_views : any) : void {
    // TODO
  }

  // Utility functions
  setHeight(height: number): void {
    this.height = height;
  }

  setUrl(url? : string | null): void {
    this.url = url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : undefined;
  }

  setActiveTab(tab: TaskTab): void {
    this.activeTab = tab;
  }
}

export class ItemDisplayPlatform extends TaskListener {
  taskParams: TaskParams;
  constructor(task: Task, taskParams: TaskParams) {
    super(task);
    this.taskParams = taskParams;
  }

  validate(mode : string) : Observable<void> {
    if (mode == 'cancel') {
      // TODO reload answer
      return EMPTY;
    }
    if (mode == 'validate') {
      return this.task.getAnswer()
        .pipe(
          switchMap(answer => this.task.gradeAnswer(answer, '')),
          switchMap((_results : any) =>
            // TODO Do something with the results
            EMPTY
          )
        );
    }
    // Other unimplemented modes
    return EMPTY;
  }

  getTaskParams(_keydefault?: [string, TaskParamsValue]) : Observable<TaskParamsValue> {
    return of(this.taskParams);
  }
}
