import { AfterViewChecked, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { interval, merge, Observable } from 'rxjs';
import { filter, map, startWith, switchMap } from 'rxjs/operators';
import { SECONDS } from 'src/app/shared/helpers/duration';
import { isNotUndefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { ItemTaskService } from '../../services/item-task.service';
import { mapToFetchState } from 'src/app/shared/operators/state';
import { capitalize } from 'src/app/shared/helpers/case_conversion';
import { ItemTaskInitService } from '../../services/item-task-init.service';
import { ItemTaskAnswerService } from '../../services/item-task-answer.service';
import { ItemTaskViewsService } from '../../services/item-task-views.service';

const initialHeight = 1200;
const additionalHeightToPreventInnerScrollIssues = 40;
const heightSyncInterval = 0.2*SECONDS;

interface TaskTab {
  name: string,
  view: string,
}

@Component({
  selector: 'alg-item-display',
  templateUrl: './item-display.component.html',
  styleUrls: [ './item-display.component.scss' ],
  providers: [ ItemTaskService, ItemTaskInitService, ItemTaskAnswerService, ItemTaskViewsService ],
})
export class ItemDisplayComponent implements OnInit, AfterViewChecked, OnChanges {
  @Input() itemData?: ItemData;
  @ViewChild('iframe') iframe?: ElementRef<HTMLIFrameElement>;

  state$ = this.taskService.task$.pipe(mapToFetchState());

  tabs$: Observable<TaskTab[]> = this.taskService.views$.pipe(
    map(views => views.map(view => ({ view, name: this.getTabNameByView(view) }))),
  );
  activeTabView$ = this.taskService.activeView$;

  iframeSrc$ = this.taskService.iframeSrc$;

  // Start updating the iframe height to match the task's height
  iframeHeight$ = merge(
    this.taskService.task$.pipe(switchMap(task => interval(heightSyncInterval).pipe(switchMap(() => task.getHeight())))),
    this.taskService.display$.pipe(map(({ height }) => height), filter(isNotUndefined)),
  ).pipe(startWith(initialHeight), map(height => height + additionalHeightToPreventInnerScrollIssues));

  constructor(
    private taskService: ItemTaskService,
  ) {}

  ngOnInit(): void {
    if (!this.itemData) throw new Error('itemData must be set in ItemDisplayComponent');
    this.taskService.configure(
      this.itemData.route,
      this.itemData.item.url ?? undefined,
      this.itemData.route.attemptId ?? this.itemData.currentResult?.attemptId,
    );
  }

  ngAfterViewChecked(): void {
    if (!this.iframe || this.taskService.initialized) return;
    this.taskService.initTask(this.iframe.nativeElement);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.itemData && !changes.itemData.firstChange) throw new Error('This component does not support change of its itemData input');
  }

  setActiveTab(tab: TaskTab): void {
    this.taskService.showView(tab.view);
  }

  private getTabNameByView(view: string): string {
    switch (view) {
      case 'editor': return $localize`Editor`;
      case 'forum': return $localize`Forum`;
      case 'hints': return $localize`Hints`;
      case 'solution': return $localize`Solution`;
      case 'submission': return $localize`Submission`;
      case 'task': return $localize`Task`;
      default: return capitalize(view);
    }
  }
}
