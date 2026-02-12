import { ChangeDetectionStrategy, Component, effect, inject, input, computed } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ItemData } from '../../models/item-data';
import { GetThreadsService } from '../../../data-access/get-threads.service';
import { Subject, filter, switchMap } from 'rxjs';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { Store } from '@ngrx/store';
import { fromForum } from 'src/app/forum/store';
import { ThreadId } from 'src/app/forum/models/threads';
import { fromObservation } from 'src/app/store/observation';
import { FullItemRoute, RawItemRoute } from 'src/app/models/routing/item-route';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { ThreadTableComponent } from './thread-table/thread-table.component';
import { UserSessionService } from 'src/app/services/user-session.service';
import { canThreadExist, canOpenThread } from 'src/app/forum/models/thread-context';
import { isUser } from 'src/app/models/routing/group-route';
import { isATask } from '../../models/item-type';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';

interface ThreadContext {
  participantId: string,
  itemId: string,
  title: string | null,
  route: FullItemRoute,
}

type AutoShowThreadDecision =
  | { decision: 'show', context: ThreadContext }
  | { decision: 'check', context: ThreadContext }
  | { decision: 'none' };

@Component({
  selector: 'alg-item-forum',
  templateUrl: './item-forum.component.html',
  styleUrls: [ './item-forum.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ThreadTableComponent,
    LoadingComponent,
    ErrorComponent,
    ButtonComponent,
  ]
})
export class ItemForumComponent {
  private store = inject(Store);
  private getThreadService = inject(GetThreadsService);
  private userSessionService = inject(UserSessionService);

  itemData = input.required<ItemData>();

  // Derived signals
  private item = computed(() => this.itemData().item);
  private userProfile = toSignal(this.userSessionService.userProfile$);

  // Signals from store
  private observationInfo = this.store.selectSignal(fromObservation.selectObservedGroupInfo);
  isObserving = this.store.selectSignal(fromObservation.selectIsObserving);
  isObservingAUser = computed(() => {
    const info = this.observationInfo();
    return info !== null && isUser(info.route);
  });
  visibleThreadId = this.store.selectSignal(fromForum.selectVisibleThreadId);

  /** Whether the item has at most one thread (Task + not observing, or Task + observing a user). */
  isSingleThreadMode = computed(() => {
    const item = this.itemData().item;
    if (!isATask(item)) return false;
    const obs = this.observationInfo();
    return obs === null || isUser(obs.route);
  });

  /**
   * Whether the thread panel should be auto-shown on launch:
   * - 'show': user has permission to open the thread directly
   * - 'check': a thread could exist but requires an API call to verify
   * - 'none': no thread possible for this context
   */
  private autoShowThreadDecision = computed((): AutoShowThreadDecision => {
    const itemData = this.itemData();
    const item = itemData.item;
    const observationInfo = this.observationInfo();
    const userProfile = this.userProfile();

    if (!userProfile || userProfile.tempUser) return { decision: 'none' };
    if (!canThreadExist(item, observationInfo)) return { decision: 'none' };

    const participantId = observationInfo ? observationInfo.route.id : userProfile.groupId;
    const context: ThreadContext = { participantId, itemId: item.id, title: item.string.title, route: itemData.route };

    if (canOpenThread(item, observationInfo)) return { decision: 'show', context };
    return { decision: 'check', context };
  });

  /** State of the single-thread placeholder (only meaningful when isSingleThreadMode is true). */
  singleThreadState = computed(() => {
    const decision = this.autoShowThreadDecision();
    if (decision.decision === 'none') return 'none' as const;

    const threadData = this.isObserving()
      ? this.observedGroupThreadsState()
      : this.myThreadsState();
    if (!threadData || threadData.isFetching) return 'fetching' as const;
    if (threadData.isError) return 'error' as const;

    const hasActiveThread = threadData.data?.some(t => t.status !== 'not_started') ?? false;

    if (decision.decision === 'show') {
      return hasActiveThread ? 'thread-open' as const : 'can-start' as const;
    }
    // decision === 'check'
    return hasActiveThread ? 'thread-open' as const : 'thread-not-started' as const;
  });

  constructor() {
    // Auto-show thread when conditions are met
    effect(() => {
      const decision = this.autoShowThreadDecision();
      if (decision.decision === 'none') return;

      if (decision.decision === 'show') {
        this.store.dispatch(fromForum.forumThreadListActions.showAsCurrentThread({
          id: { participantId: decision.context.participantId, itemId: decision.context.itemId },
          item: { title: decision.context.title, route: decision.context.route }
        }));
        return;
      }

      // decision === 'check': wait for list data
      const threadData = this.isObserving()
        ? this.observedGroupThreadsState()
        : this.myThreadsState();
      if (threadData?.isReady && threadData.data.some(t => t.status !== 'not_started')) {
        this.store.dispatch(fromForum.forumThreadListActions.showAsCurrentThread({
          id: { participantId: decision.context.participantId, itemId: decision.context.itemId },
          item: { title: decision.context.title, route: decision.context.route }
        }));
      }
    });
  }

  // Refresh subjects for each section
  private refreshMyThreads$ = new Subject<void>();
  private refreshOthersThreads$ = new Subject<void>();
  private refreshObservedGroupThreads$ = new Subject<void>();

  // Parameters for non-observing thread fetches (null when observing)
  private nonObservingItem = computed(() => (this.isObserving() ? null : this.item()));

  // Fetch state for "My help requests" (only when not observing)
  myThreadsState = toSignal(
    toObservable(this.nonObservingItem).pipe(
      filter(isNotNull),
      switchMap(item => this.getThreadService.get(item.id, { isMine: true }).pipe(
        mapToFetchState({ resetter: this.refreshMyThreads$ })
      ))
    )
  );

  // Fetch state for "Other users' requests" (only when not observing)
  othersThreadsState = toSignal(
    toObservable(this.nonObservingItem).pipe(
      filter(isNotNull),
      switchMap(item => this.getThreadService.get(item.id, { isMine: false }).pipe(
        mapToFetchState({ resetter: this.refreshOthersThreads$ })
      ))
    )
  );

  // Parameters for observed group thread fetch (null when not observing)
  private observedGroupParams = computed(() => {
    const observationInfo = this.observationInfo();
    if (!observationInfo) return null;
    return { item: this.item(), groupId: observationInfo.route.id };
  });

  // Fetch state for observed group's requests (only when observing)
  observedGroupThreadsState = toSignal(
    toObservable(this.observedGroupParams).pipe(
      filter(isNotNull),
      switchMap(({ item, groupId }) => this.getThreadService.get(item.id, { watchedGroupId: groupId }).pipe(
        mapToFetchState({ resetter: this.refreshObservedGroupThreads$ })
      ))
    )
  );

  refreshMyThreads(): void {
    this.refreshMyThreads$.next();
  }

  refreshOthersThreads(): void {
    this.refreshOthersThreads$.next();
  }

  refreshObservedGroupThreads(): void {
    this.refreshObservedGroupThreads$.next();
  }

  hideThreadPanel(): void {
    this.store.dispatch(fromForum.forumThreadListActions.hideCurrentThread());
  }

  showThreadPanel(id: ThreadId, item: { title: string, route: RawItemRoute }): void {
    this.store.dispatch(
      fromForum.forumThreadListActions.showAsCurrentThread({ id, item })
    );
  }

  /** Re-show the single thread panel (used by the placeholder button). */
  showSingleThread(): void {
    const decision = this.autoShowThreadDecision();
    if (decision.decision === 'none') return;
    this.store.dispatch(fromForum.forumThreadListActions.showAsCurrentThread({
      id: { participantId: decision.context.participantId, itemId: decision.context.itemId },
      item: { title: decision.context.title, route: decision.context.route }
    }));
  }
}
