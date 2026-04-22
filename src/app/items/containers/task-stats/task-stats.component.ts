import { Component, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { Subject, switchMap } from 'rxjs';
import { distinctUntilChanged, map, share } from 'rxjs/operators';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { ItemData } from '../../models/item-data';
import { PermissionsTokenService } from '../../data-access/permissions-token.service';
import { GetTaskStatsService } from '../../data-access/get-task-stats.service';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { ScoreOverTimeChartComponent } from './score-over-time-chart.component';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';
import { taskStatDescriptors } from '../../models/task-stats';

@Component({
  selector: 'alg-task-stats',
  templateUrl: './task-stats.component.html',
  styleUrls: [ './task-stats.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    LoadingComponent,
    ErrorComponent,
    ScoreOverTimeChartComponent,
    TooltipDirective,
  ],
})
export class TaskStatsComponent {
  private permissionsTokenService = inject(PermissionsTokenService);
  private getTaskStatsService = inject(GetTaskStatsService);

  readonly itemData = input.required<ItemData>();

  readonly metrics = taskStatDescriptors;

  private readonly refresh$ = new Subject<void>();

  state$ = toObservable(this.itemData).pipe(
    map(itemData => itemData.item.id),
    distinctUntilChanged(),
    switchMap(itemId => this.permissionsTokenService.generate(itemId).pipe(
      switchMap(token => this.getTaskStatsService.get(token)),
    )),
    mapToFetchState({ resetter: this.refresh$ }),
    share(),
  );

  refresh(): void {
    this.refresh$.next();
  }
}
