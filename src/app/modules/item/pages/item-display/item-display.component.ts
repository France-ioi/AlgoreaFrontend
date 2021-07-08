import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ItemData } from '../../services/item-datasource.service';
import { Platform, Task, TaskParams, TaskProxyManager } from 'src/app/modules/item/task/task-xd-pr';
import { CompleteFunction, ErrorFunction } from 'src/app/modules/item/task/rxjschannel';
import { interval, Subscription } from 'rxjs';

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

  taskProxyManager: TaskProxyManager;
  task?: Task;
  platform? : Platform;

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
    this.taskProxyManager = new TaskProxyManager();
  }


  // Lifecycle functions
  ngOnInit(): void {
    const url = this.itemData?.item.url || '';
    // TODO get sToken
    const sToken = '';
    this.setUrl(this.taskProxyManager.getUrl(url, sToken, 'http://algorea.pem.dev', 'task-'));
  }

  ngAfterViewInit(): void {
    if (this.iframe) {
      const iframe = this.iframe.nativeElement;
      this.taskProxyManager.getTaskProxy(iframe, this.taskIframeLoaded.bind(this), false);
    }
  }

  ngOnDestroy(): void {
    this.heightInterval?.unsubscribe();
    this.saveInterval?.unsubscribe();
    this.taskProxyManager.deleteTaskProxy();
  }

  // Task iframe is ready
  taskIframeLoaded(task: Task): void {
    this.task = task;
    const taskParams = { minScore: -3, maxScore: 10, randomSeed: 0, noScore: 0, readOnly: false, options: {} };
    this.platform = new ItemDisplayPlatform(task, taskParams);
    this.task.setPlatform(this.platform);

    const initialViews = { task: true, solution: true, editor: true, hints: true, grader: true, metadata: true };
    task.load(initialViews, this.taskLoaded.bind(this));
  }

  // task.load done
  taskLoaded(): void {
    this.state = 'loaded';

    this.updateHeight();
    this.heightInterval = interval(1000).subscribe(() => this.updateHeight());
    this.saveInterval = interval(1000).subscribe(() => this.getAnswerState());

    this.task?.showViews({ task: true }, () => {});

    this.task?.getViews((views : any) => {
      this.setViews(views);
    });
  }

  // Communication with the task
  getAnswerState(): void {
    this.task?.getAnswer((answer : string) => {
      this.task?.getState((state: string) => {
        this.saveAnswerState(answer, state);
      });
    });
  }

  reloadAnswerState(answer : string, state : string, callback : CompleteFunction<void>): void {
    this.task?.reloadAnswer(answer, () => {
      this.task?.reloadState(state, callback);
    });
  }

  saveAnswerState(answer : string, state : string) : void {
    if (answer != this.lastAnswer || state != this.lastState) {
      // TODO Save
    }
    this.lastAnswer = answer;
    this.lastState = state;
  }

  updateHeight(): void {
    this.task?.getHeight(this.setHeight.bind(this));
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

export class ItemDisplayPlatform extends Platform {
  taskParams: any;
  constructor(task: Task, taskParams: TaskParams) {
    super(task);
    this.taskParams = taskParams;
  }

  validate(mode : string, success : CompleteFunction<void>, _error : ErrorFunction) : void {
    if (mode == 'cancel') {
      // TODO reload answer
    }
    if (mode == 'validate') {
      this.task.getAnswer((answer: string) => {
        this.task.gradeAnswer(answer, '', (results : any) => {
          success(results);
        });
      });
    }
  }

  getTaskParams(_key : string | undefined, _defaultValue : any, success : (result : any) => void, _? : ErrorFunction) : void {
    success(this.taskParams);
  }
}
