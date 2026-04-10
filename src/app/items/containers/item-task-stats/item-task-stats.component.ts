import { Component, inject, Input, OnChanges, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ReplaySubject, Subject, switchMap } from 'rxjs';
import { share } from 'rxjs/operators';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { ItemData } from '../../models/item-data';
import { PermissionsTokenService } from '../../data-access/permissions-token.service';
import { GetTaskStatsService, ScoreDistributionEntry } from '../../data-access/get-task-stats.service';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { Duration } from 'src/app/utils/duration';

const TIME_BUCKET_KEYS = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60 ];

@Component({
  selector: 'alg-item-task-stats',
  templateUrl: './item-task-stats.component.html',
  styleUrls: [ './item-task-stats.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    LoadingComponent,
    ErrorComponent,
  ],
})
export class ItemTaskStatsComponent implements OnChanges, OnDestroy {
  private permissionsTokenService = inject(PermissionsTokenService);
  private getTaskStatsService = inject(GetTaskStatsService);

  @Input() itemData?: ItemData;

  private readonly itemId$ = new ReplaySubject<string>(1);
  private readonly refresh$ = new Subject<void>();

  readonly timeBucketKeys = TIME_BUCKET_KEYS;

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

  trackByScore(_index: number, entry: ScoreDistributionEntry): number {
    return entry.score;
  }

  getTimeValue(entry: ScoreDistributionEntry, key: number): number {
    return entry.pctByTime[key.toString()] ?? 0;
  }

  formatTimeBucketLabel(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    return `${minutes / 60}h`;
  }
}
