import { ChangeDetectionStrategy, Component, effect, inject, input, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ItemData } from '../../models/item-data';
import { GetThreadsService } from '../../../data-access/get-threads.service';
import { Store } from '@ngrx/store';
import { fromForum } from 'src/app/forum/store';
import { ThreadId } from 'src/app/forum/models/threads';
import { fromObservation } from 'src/app/store/observation';
import { FullItemRoute, RawItemRoute } from 'src/app/models/routing/item-route';
import { ThreadTableComponent } from './thread-table/thread-table.component';
import { ForumThreadPlaceholderComponent, SingleThreadState } from './forum-thread-placeholder/forum-thread-placeholder.component';
import { UserSessionService } from 'src/app/services/user-session.service';
import { canThreadExist, canOpenThread } from 'src/app/forum/models/thread-context';
import { isUser } from 'src/app/models/routing/group-route';
import { fetchList } from 'src/app/utils/fetch-list';

interface ThreadContext {
  participantId: string,
  itemId: string,
  title: string | null,
  route: FullItemRoute,
}

type SingleThreadInfo =
  | { state: SingleThreadState, context: ThreadContext }
  | { state: 'none' };

@Component({
  selector: 'alg-item-forum',
  templateUrl: './item-forum.component.html',
  styleUrls: [ './item-forum.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ThreadTableComponent,
    ForumThreadPlaceholderComponent,
  ],
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

  /** Whether at most one thread can exist in this context (Task + not observing, or Task + observing a user). */
  singleThreadContext = computed(() => canThreadExist(this.itemData().item, this.observationInfo()));

  // --- Data fetching (using fetchList utility) ---

  private noObservationParams = computed(() => (this.isObserving() ? null : { item: this.item() }));

  private myThreads = fetchList(this.noObservationParams, ({ item }) => this.getThreadService.get(item.id, { isMine: true }));
  myThreadsState = this.myThreads.state;
  refreshMyThreads = this.myThreads.refresh;

  private othersThreads = fetchList(this.noObservationParams, ({ item }) => this.getThreadService.get(item.id, { isMine: false }));
  othersThreadsState = this.othersThreads.state;
  refreshOthersThreads = this.othersThreads.refresh;

  private observedGroupParams = computed(() => {
    const observationInfo = this.observationInfo();
    if (!observationInfo) return null;
    return { item: this.item(), groupId: observationInfo.route.id };
  });

  private observedGroupThreads = fetchList(this.observedGroupParams, ({ item, groupId }) =>
    this.getThreadService.get(item.id, { watchedGroupId: groupId }),
  );
  observedGroupThreadsState = this.observedGroupThreads.state;
  refreshObservedGroupThreads = this.observedGroupThreads.refresh;

  // --- Single-thread info (state + context for dispatch) ---

  /** Combined state and context for the single-thread placeholder. */
  singleThreadInfo = computed((): SingleThreadInfo => {
    if (!this.singleThreadContext()) return { state: 'none' };

    const itemData = this.itemData();
    const item = itemData.item;
    const observationInfo = this.observationInfo();

    const userProfile = this.userProfile();
    if (!userProfile) throw new Error('Forum should not be shown for unauthenticated users');

    const participantId = observationInfo ? observationInfo.route.id : userProfile.groupId;
    const context: ThreadContext = { participantId, itemId: item.id, title: item.string.title, route: itemData.route };
    const canOpen = canOpenThread(item, observationInfo);

    const threadData = this.isObserving() ? this.observedGroupThreadsState() : this.myThreadsState();

    // When user can open the thread directly, don't wait for fetch — return immediately so the
    // effect dispatches without delay. The state may temporarily be 'not-started-can-start' until
    // fetch completes and reveals it should be 'started'. This is acceptable as both trigger auto-show.
    if (canOpen) {
      const hasStartedThread = threadData?.isReady && threadData.data.some(t => t.status !== 'not_started');
      return { state: hasStartedThread ? 'started' : 'not-started-can-start', context };
    }

    // Otherwise, wait for fetch data to determine if a thread exists
    if (!threadData || threadData.isFetching) return { state: 'fetching', context };
    if (threadData.isError) return { state: 'error', context };

    const hasStartedThread = threadData.data?.some(t => t.status !== 'not_started') ?? false;
    return { state: hasStartedThread ? 'started' : 'not-started-cannot-start', context };
  });

  constructor() {
    // Auto-show thread when conditions are met
    effect(() => {
      const info = this.singleThreadInfo();
      if (info.state === 'started' || info.state === 'not-started-can-start') {
        this.dispatchShowThread(info.context);
      }
    });
  }

  hideThreadPanel(): void {
    this.store.dispatch(fromForum.forumThreadListActions.hideCurrentThread());
  }

  showThreadPanel(id: ThreadId, item: { title: string, route: RawItemRoute }): void {
    this.store.dispatch(fromForum.forumThreadListActions.showAsCurrentThread({ id, item }));
  }

  /** Re-show the single thread panel (used by the placeholder button). */
  showSingleThread(): void {
    const info = this.singleThreadInfo();
    if (info.state !== 'none') this.dispatchShowThread(info.context);
  }

  private dispatchShowThread(context: ThreadContext): void {
    this.store.dispatch(fromForum.forumThreadListActions.showAsCurrentThread({
      id: { participantId: context.participantId, itemId: context.itemId },
      item: { title: context.title, route: context.route },
    }));
  }
}
