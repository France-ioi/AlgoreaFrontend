import { ChangeDetectionStrategy, Component, effect, inject, input, computed } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ItemData } from '../../models/item-data';
import { GetThreadsService } from '../../../data-access/get-threads.service';
import { catchError, of, Subject, filter, switchMap, map } from 'rxjs';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { Store } from '@ngrx/store';
import { fromForum } from 'src/app/forum/store';
import { ThreadId } from 'src/app/forum/models/threads';
import { fromObservation } from 'src/app/store/observation';
import { FullItemRoute, RawItemRoute } from 'src/app/models/routing/item-route';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { ThreadTableComponent } from './thread-table/thread-table.component';
import { UserSessionService } from 'src/app/services/user-session.service';
import { ThreadService } from 'src/app/data-access/thread.service';
import { canThreadExist, canOpenThread } from 'src/app/forum/models/thread-context';

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
  ]
})
export class ItemForumComponent {
  private store = inject(Store);
  private getThreadService = inject(GetThreadsService);
  private threadService = inject(ThreadService);
  private userSessionService = inject(UserSessionService);

  itemData = input.required<ItemData>();

  // Derived signals
  private item = computed(() => this.itemData().item);
  private userProfile = toSignal(this.userSessionService.userProfile$);

  // Signals from store
  private observationInfo = this.store.selectSignal(fromObservation.selectObservedGroupInfo);
  isObserving = this.store.selectSignal(fromObservation.selectIsObserving);
  visibleThreadId = this.store.selectSignal(fromForum.selectVisibleThreadId);

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

  /**
   * Thread info resolved via API for cases where the user lacks direct open permission
   * but a thread may still exist (e.g. a teacher asked a question).
   */
  private autoShowThreadApiCheck = toSignal(
    toObservable(this.autoShowThreadDecision).pipe(
      filter((d): d is Extract<AutoShowThreadDecision, { decision: 'check' }> => d.decision === 'check'),
      switchMap(({ context }) =>
        this.threadService.get(context.itemId, context.participantId).pipe(
          map(thread => (thread.status !== 'not_started' ? context : null)),
          catchError(() => of(null)) // 403 or other error
        )
      )
    )
  );

  constructor() {
    // Auto-show thread when conditions are met (either immediate or via API check)
    effect(() => {
      const decision = this.autoShowThreadDecision();
      const context = decision.decision === 'show'
        ? decision.context
        : this.autoShowThreadApiCheck();

      if (context) {
        this.store.dispatch(fromForum.forumThreadListActions.showAsCurrentThread({
          id: { participantId: context.participantId, itemId: context.itemId },
          item: { title: context.title, route: context.route }
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
}
