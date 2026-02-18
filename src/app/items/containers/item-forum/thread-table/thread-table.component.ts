import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass, DatePipe } from '@angular/common';
import { FetchState } from 'src/app/utils/state';
import { Threads, Thread } from 'src/app/data-access/get-threads.service';
import { ThreadStatusDisplayPipe } from 'src/app/pipes/threadStatusDisplay';
import { UserCaptionPipe } from 'src/app/pipes/userCaption';
import { GroupLinkPipe } from 'src/app/pipes/groupLink';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRouteWithExtraPipe } from 'src/app/pipes/itemRoute';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { SwitchComponent } from 'src/app/ui-components/switch/switch.component';
import { ItemData } from 'src/app/items/models/item-data';
import { ItemRoute, RawItemRoute } from 'src/app/models/routing/item-route';
import { ThreadId } from 'src/app/forum/models/threads';

export type ThreadListType = 'mine' | 'others' | 'observed';

@Component({
  selector: 'alg-thread-table',
  templateUrl: './thread-table.component.html',
  styleUrls: [ './thread-table.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ErrorComponent,
    LoadingComponent,
    NgClass,
    RouterLink,
    DatePipe,
    RouteUrlPipe,
    GroupLinkPipe,
    UserCaptionPipe,
    ThreadStatusDisplayPipe,
    ButtonComponent,
    ItemRouteWithExtraPipe,
    SwitchComponent,
  ]
})
export class ThreadTableComponent {
  state = input<FetchState<Threads>>();
  showUserColumn = input(false);
  threadListType = input<ThreadListType>('mine');
  itemData = input.required<ItemData>();
  visibleThreadId = input<ThreadId | null>(null);

  refresh = output<void>();
  showThread = output<{ id: ThreadId, item: { title: string, route: RawItemRoute } }>();
  hideThread = output<void>();

  showClosedThreads = signal(false);

  filteredData = computed(() => {
    const data = this.state()?.data;
    if (!data) return undefined;
    if (this.showClosedThreads()) return data;
    return data.filter(t => t.status !== 'closed');
  });

  hasClosedThreads = computed(() => {
    const data = this.state()?.data;
    return data?.some(t => t.status === 'closed') ?? false;
  });

  onRefresh(): void {
    this.refresh.emit();
  }

  onToggleThread(thread: Thread, threadItemRoute: RawItemRoute): void {
    if (this.isThreadVisible(thread)) {
      this.hideThread.emit();
    } else {
      this.showThread.emit({
        id: { participantId: thread.participant.id, itemId: thread.item.id },
        item: { title: thread.item.title, route: threadItemRoute }
      });
    }
  }

  isThreadVisible(thread: Thread): boolean {
    const visibleId = this.visibleThreadId();
    return visibleId !== null &&
      visibleId.participantId === thread.participant.id &&
      visibleId.itemId === thread.item.id;
  }

  /** Route parameter to observe the thread's participant. Empty if viewing own threads. */
  getParticipantObservationParam(thread: Thread): Partial<ItemRoute> {
    if (this.threadListType() === 'mine') return {};
    return { observedGroup: { id: thread.participant.id, isUser: true } };
  }

  getThreadItemRoute(thread: Thread): RawItemRoute {
    const itemRoute = this.itemData().route;
    const rowItemRoute = {
      id: thread.item.id,
      contentType: itemRoute.contentType,
      path: itemRoute.path,
    } as RawItemRoute;
    return rowItemRoute.id === itemRoute.id ? itemRoute : rowItemRoute;
  }
}
