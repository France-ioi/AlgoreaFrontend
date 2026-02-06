import { ChangeDetectionStrategy, Component, inject, input, computed } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ItemData } from '../../models/item-data';
import { GetThreadsService } from '../../../data-access/get-threads.service';
import { Subject, filter, switchMap } from 'rxjs';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { Store } from '@ngrx/store';
import { fromForum } from 'src/app/forum/store';
import { ThreadId } from 'src/app/forum/models/threads';
import { fromObservation } from 'src/app/store/observation';
import { RawItemRoute } from 'src/app/models/routing/item-route';
import { isDefined } from 'src/app/utils/null-undefined-predicates';
import { ThreadTableComponent } from './thread-table/thread-table.component';

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

  itemData = input.required<ItemData>();

  // Derived signal for the item
  private item = computed(() => this.itemData().item);

  // Signals from store
  private observedGroupId = this.store.selectSignal(fromObservation.selectObservedGroupId);
  isObserving = this.store.selectSignal(fromObservation.selectIsObserving);
  visibleThreadId = this.store.selectSignal(fromForum.selectVisibleThreadId);

  // Refresh subjects for each section
  private refreshMyThreads$ = new Subject<void>();
  private refreshOthersThreads$ = new Subject<void>();
  private refreshObservedGroupThreads$ = new Subject<void>();

  // Fetch state for "My help requests"
  myThreadsState = toSignal(
    toObservable(this.item).pipe(
      switchMap(item => this.getThreadService.get(item.id, { isMine: true }).pipe(
        mapToFetchState({ resetter: this.refreshMyThreads$ })
      ))
    )
  );

  // Fetch state for "Other users' requests"
  othersThreadsState = toSignal(
    toObservable(this.item).pipe(
      switchMap(item => this.getThreadService.get(item.id, { isMine: false }).pipe(
        mapToFetchState({ resetter: this.refreshOthersThreads$ })
      ))
    )
  );

  // Fetch state for observed group's requests
  private observedGroupParams = computed(() => ({
    item: this.item(),
    groupId: this.observedGroupId()
  }));

  observedGroupThreadsState = toSignal(
    toObservable(this.observedGroupParams).pipe(
      filter(({ groupId }) => isDefined(groupId)),
      switchMap(({ item, groupId }) => this.getThreadService.get(item.id, { watchedGroupId: groupId! }).pipe(
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
