import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, map } from 'rxjs';
import { TaskValidationService } from '../../data-access/get-task-validations.service';
import { EntityResolutionCacheService } from '../../data-access/entity-resolution-cache.service';
import { RawTaskValidation } from '../../models/task-validation';
import { liveActivityValidationSchema } from '../../models/websocket-community-messages';
import { communityActivityFeedActions, fromCommunity } from '../../store';
import { fromWebsocket, websocketClientActions } from '../../../store/websocket';
import { fetchList } from '../../../utils/fetch-list';
import { LoadingComponent } from '../../../ui-components/loading/loading.component';
import { ErrorComponent } from '../../../ui-components/error/error.component';
import { RelativeTimeComponent } from '../../../ui-components/relative-time/relative-time.component';
import { UserAvatarComponent } from '../../../ui-components/user-avatar/user-avatar.component';
import { ItemRoutePipe } from '../../../pipes/itemRoute';
import { RouteUrlPipe } from '../../../pipes/routeUrl';

const MAX_ENTRIES = 10;
const MAX_DISPLAY = 20;

@Component({
  selector: 'alg-community-activity-feed',
  templateUrl: './community-activity-feed.component.html',
  styleUrls: [ './community-activity-feed.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    LoadingComponent,
    ErrorComponent,
    RelativeTimeComponent,
    UserAvatarComponent,
    ItemRoutePipe,
    RouteUrlPipe,
  ],
})
export class CommunityActivityFeedComponent {
  private store = inject(Store);
  private actions$ = inject(Actions);
  private destroyRef = inject(DestroyRef);
  private taskValidationService = inject(TaskValidationService);
  private cache = inject(EntityResolutionCacheService);

  private wsOpen = toSignal(this.store.select(fromWebsocket.selectOpen), { initialValue: false });
  private feedActive = toSignal(this.store.select(fromCommunity.selectActivityFeedActive), { initialValue: false });
  isWsLive = computed(() => this.wsOpen() && this.feedActive());

  private taskValidations = fetchList(() => this.taskValidationService.getLatest());
  taskValidationsState = this.taskValidations.state;

  private itemTitles = signal(new Map<string, string | null>());
  private liveEntries = signal<RawTaskValidation[]>([]);
  private liveAnswerIds = signal(new Set<string>());

  entries = computed(() => {
    const restState = this.taskValidationsState();
    const restData = restState.isReady ? restState.data.slice(0, MAX_ENTRIES) : [];
    const seen = new Set<string>();
    const merged: RawTaskValidation[] = [];
    for (const entry of [ ...this.liveEntries(), ...restData ]) {
      if (!seen.has(entry.answerId)) {
        seen.add(entry.answerId);
        merged.push(entry);
      }
    }
    return merged.slice(0, MAX_DISPLAY).map(v => ({
      ...v,
      date: new Date(v.time),
      itemTitle: this.itemTitles().get(v.itemId),
      isLive: this.liveAnswerIds().has(v.answerId),
    }));
  });

  constructor() {
    this.store.dispatch(communityActivityFeedActions.opened());
    this.destroyRef.onDestroy(() => this.store.dispatch(communityActivityFeedActions.closed()));

    this.actions$.pipe(
      ofType(websocketClientActions.messageReceived),
      map(({ message }) => liveActivityValidationSchema.safeParse(message)),
      filter(result => result.success),
      map(result => result.data),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(validation => {
      this.prependLiveEntry({
        time: validation.time,
        participantId: validation.participantId,
        itemId: validation.itemId,
        answerId: validation.answerId,
      });
    });

    effect(() => {
      const state = this.taskValidationsState();
      if (state.tag !== 'ready') return;
      this.resolveEntries(state.data.slice(0, MAX_ENTRIES));
    });
  }

  onRefresh(): void {
    this.taskValidations.refresh();
  }

  private prependLiveEntry(entry: RawTaskValidation): void {
    const restState = this.taskValidationsState();
    const restData = restState.isReady ? restState.data : [];
    const isDuplicate = this.liveEntries().some(e => e.answerId === entry.answerId)
      || restData.some(e => e.answerId === entry.answerId);
    if (isDuplicate) return;

    this.liveEntries.update(entries => [ entry, ...entries ].slice(0, MAX_DISPLAY));
    this.liveAnswerIds.update(ids => new Set(ids).add(entry.answerId));
    this.subscribeItemResolutions([ entry.itemId ]);
  }

  private resolveEntries(taskValidations: RawTaskValidation[]): void {
    const uniqueItemIds = [ ...new Set(taskValidations.map(v => v.itemId)) ];
    this.cache.prefetchItems(uniqueItemIds);
    this.subscribeItemResolutions(uniqueItemIds);
  }

  private subscribeItemResolutions(itemIds: string[]): void {
    for (const iid of itemIds) {
      this.cache.resolveItem(iid).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(title => {
        this.itemTitles.update(m => new Map(m).set(iid, title));
      });
    }
  }
}
