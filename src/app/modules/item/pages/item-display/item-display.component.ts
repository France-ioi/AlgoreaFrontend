import { AfterViewChecked, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { Task, } from 'src/app/modules/item/task-communication/task-proxy';
import { interval, merge, Observable } from 'rxjs';
import { filter, map, startWith, switchMap } from 'rxjs/operators';
import { errorState, FetchState } from 'src/app/shared/helpers/state';
import { SECONDS } from 'src/app/shared/helpers/duration';
import { isNotUndefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { ItemTaskService } from '../../services/item-task.service';
import { mapToFetchState } from 'src/app/shared/operators/state';

const initialHeight = 1200;
const heightSyncInterval = 0.2*SECONDS;

interface TaskTab {
  name: string
}

@Component({
  selector: 'alg-item-display',
  templateUrl: './item-display.component.html',
  styleUrls: [ './item-display.component.scss' ],
  providers: [ ItemTaskService ],
})
export class ItemDisplayComponent implements OnInit, AfterViewChecked, OnChanges {
  @Input() itemData?: ItemData;
  @ViewChild('iframe') iframe?: ElementRef<HTMLIFrameElement>;

  state$: Observable<FetchState<Task>> = merge(
    this.taskService.task$.pipe(mapToFetchState()),
    this.taskService.error$.pipe(map(err => errorState(err))),
  );

  // Tabs displayed above the task
  // TODO get views from the task and make actual tabs
  activeTab: TaskTab = { name: 'Task' };
  tabs: TaskTab[] = [ this.activeTab ];

  iframeSrc$ = this.taskService.iframeSrc$;

  // Start updating the iframe height to match the task's height
  iframeHeight$ = merge(
    this.taskService.task$.pipe(switchMap(task => interval(heightSyncInterval).pipe(switchMap(() => task.getHeight())))),
    this.taskService.display$.pipe(map(({ height }) => height), filter(isNotUndefined)),
  ).pipe(startWith(initialHeight), map(height => height + 40));

  constructor(private taskService: ItemTaskService) {}

  ngOnInit(): void {
    if (!this.itemData) throw new Error('itemData must be set in ItemDisplayComponent');
    this.taskService.getIframeConfig(this.itemData.item, this.itemData.route.attemptId ?? this.itemData.currentResult?.attemptId);
  }

  ngAfterViewChecked(): void {
    if (!this.iframe || this.taskService.initialized) return;
    this.taskService.initTask(this.iframe.nativeElement);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.itemData && !changes.itemData.firstChange) throw new Error('This component does not support change of its itemData input');
  }

  setActiveTab(tab: TaskTab): void {
    this.activeTab = tab;
  }
}
