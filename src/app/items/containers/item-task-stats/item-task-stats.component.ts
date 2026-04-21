import { Component, inject, Input, OnChanges, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ReplaySubject, Subject, switchMap } from 'rxjs';
import { share } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { ItemData } from '../../models/item-data';
import { PermissionsTokenService } from '../../data-access/permissions-token.service';
import { GetTaskStatsService, TaskStats } from '../../data-access/get-task-stats.service';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { ScoreOverTimeChartComponent } from './score-over-time-chart.component';
import { Duration } from 'src/app/utils/duration';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';
import { IsAChapterPipe, IsASkillPipe } from '../../models/item-type';
import { AllowsEditingAllItemPipe } from '../../models/item-edit-permission';
import { fromObservation } from 'src/app/store/observation';

@Component({
  selector: 'alg-item-task-stats',
  templateUrl: './item-task-stats.component.html',
  styleUrls: [ './item-task-stats.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    LoadingComponent,
    ErrorComponent,
    ScoreOverTimeChartComponent,
    TooltipDirective,
    IsAChapterPipe,
    IsASkillPipe,
    AllowsEditingAllItemPipe,
  ],
})
export class ItemTaskStatsComponent implements OnChanges, OnDestroy {
  private permissionsTokenService = inject(PermissionsTokenService);
  private getTaskStatsService = inject(GetTaskStatsService);
  private store = inject(Store);

  @Input() itemData?: ItemData;

  isObserving = this.store.selectSignal(fromObservation.selectIsObserving);

  private readonly itemId$ = new ReplaySubject<string>(1);
  private readonly refresh$ = new Subject<void>();

  state$ = this.itemId$.pipe(
    switchMap(itemId => this.permissionsTokenService.generate(itemId).pipe(
      switchMap(token => this.getTaskStatsService.get(token)),
    )),
    mapToFetchState({ resetter: this.refresh$ }),
    share(),
  );

  ngOnChanges(): void {
    if (this.itemData) {
      this.itemId$.next(this.itemData.item.id);
    }
  }

  ngOnDestroy(): void {
    this.itemId$.complete();
    this.refresh$.complete();
  }

  refresh(): void {
    this.refresh$.next();
  }

  formatDuration(ms: number | null): string {
    if (ms === null) return '—';
    return new Duration(ms).toReadable();
  }

  formatScore(score: number | null): string {
    if (score === null) return '—';
    return score.toFixed(1);
  }

  validationRate(stats: TaskStats): number | null {
    const perfect = stats.scoreDistribution.find(e => e.score === 100);
    return perfect ? perfect.pctUsersAbove : null;
  }

  formatPercent(value: number | null): string {
    if (value === null) return '—';
    return `${Math.round(value)}%`;
  }
}
