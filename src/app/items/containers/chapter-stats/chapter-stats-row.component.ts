import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, switchMap } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { ItemChildren } from 'src/app/data-access/get-item-children.service';
import { ItemRoutePipe, ItemRouteWithExtraPipe } from 'src/app/pipes/itemRoute';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { allowsEditingAll } from '../../models/item-edit-permission';
import { PermissionsTokenService } from '../../data-access/permissions-token.service';
import { GetTaskStatsService } from '../../data-access/get-task-stats.service';
import { TaskStatsLoaderService } from '../../data-access/task-stats-loader.service';
import { TaskStatDescriptor } from '../../models/task-stats';

type RowMode = 'cannot-edit' | 'not-a-task' | 'fetch';

@Component({
  selector: 'tr[alg-chapter-stats-row]',
  templateUrl: './chapter-stats-row.component.html',
  styleUrls: [ './chapter-stats-row.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    RouterLink,
    LoadingComponent,
    ButtonComponent,
    ItemRoutePipe,
    ItemRouteWithExtraPipe,
    RouteUrlPipe,
  ],
})
export class ChapterStatsRowComponent {
  private permissionsTokenService = inject(PermissionsTokenService);
  private getTaskStatsService = inject(GetTaskStatsService);
  private loader = inject(TaskStatsLoaderService);

  readonly child = input.required<ItemChildren[number]>();
  readonly columns = input.required<TaskStatDescriptor[]>();
  readonly parentPath = input.required<string[]>();
  readonly parentAttemptId = input<string>();

  readonly mode = computed<RowMode>(() => {
    const child = this.child();
    if (!allowsEditingAll(child.permissions)) return 'cannot-edit';
    if (child.type !== 'Task') return 'not-a-task';
    return 'fetch';
  });

  private readonly refresh$ = new Subject<void>();

  // distinctUntilChanged: defensive guard so identical consecutive emissions don't cancel
  // the in-flight loader.enqueue(...) via switchMap (which would re-queue the row and could
  // leave non-first rows stuck "loading" forever).
  readonly state$ = toObservable(computed(() => (this.mode() === 'fetch' ? this.child().id : null))).pipe(
    filter((id): id is string => id !== null),
    distinctUntilChanged(),
    switchMap(id => this.loader.enqueue(
      this.permissionsTokenService.generate(id).pipe(
        switchMap(token => this.getTaskStatsService.get(token)),
      ),
    )),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  refresh(): void {
    this.refresh$.next();
  }
}
