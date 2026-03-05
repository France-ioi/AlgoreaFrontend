import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { GetThreadsService } from '../../../data-access/get-threads.service';
import { fetchList } from '../../../utils/fetch-list';
import { ThreadTableComponent } from '../../../items/containers/item-forum/thread-table/thread-table.component';
import { fromForum } from '../../../forum/store';
import { ThreadId } from '../../../forum/models/threads';
import { RawItemRoute } from '../../../models/routing/item-route';

@Component({
  selector: 'alg-community-threads',
  templateUrl: './community-threads.component.html',
  styleUrls: [ './community-threads.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ThreadTableComponent,
  ],
})
export class CommunityThreadsComponent {
  private store = inject(Store);
  private getThreadService = inject(GetThreadsService);

  private threads = fetchList(
    computed(() => ({})),
    () => this.getThreadService.get(undefined, { isMine: false }),
  );
  threadsState = this.threads.state;
  refreshThreads = this.threads.refresh;
  emptyMessage = $localize`No threads waiting for reply.`;
  visibleThreadId = this.store.selectSignal(fromForum.selectVisibleThreadId);

  showThreadPanel(id: ThreadId, item: { title: string, route: RawItemRoute }): void {
    this.store.dispatch(fromForum.forumThreadListActions.showAsCurrentThread({ id, item }));
  }

  hideThreadPanel(): void {
    this.store.dispatch(fromForum.forumThreadListActions.hideCurrentThread());
  }
}
