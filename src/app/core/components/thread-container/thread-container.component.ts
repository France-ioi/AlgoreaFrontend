import { AfterViewInit, Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { DiscussionService } from 'src/app/modules/item/services/discussion.service';
import { combineLatest, distinctUntilChanged, filter, Subscription, switchMap } from 'rxjs';
import { ThreadComponent } from '../thread/thread.component';
import { ThreadService } from '../../../modules/item/services/threads.service';
import { UserSessionService } from '../../../shared/services/user-session.service';
import { GetItemByIdService } from '../../../modules/item/http-services/get-item-by-id.service';
import { isNotNull } from '../../../shared/helpers/null-undefined-predicates';

@Component({
  selector: 'alg-thread-container',
  templateUrl: './thread-container.component.html',
  styleUrls: [ './thread-container.component.scss' ],
})
export class ThreadContainerComponent implements AfterViewInit, OnDestroy {
  @ViewChild(ThreadComponent) threadComponent?: ThreadComponent;

  @Input() topCompensation = 0;

  visible$ = this.discussionService.visible$;
  readonly threadItem$ = combineLatest([
    this.userSessionService.userProfile$,
    this.threadService.threadId$.pipe(
      filter(isNotNull),
      distinctUntilChanged((x,y) => x?.participantId === y?.participantId && x?.itemId === y?.itemId),
    ),
    this.discussionService.visible$.pipe(filter(visible => visible), distinctUntilChanged()),
  ]).pipe(
    switchMap(([ user, threadId ]) =>
      this.getItemByIdService.get(threadId.itemId, user.groupId === threadId.participantId ? undefined : threadId.participantId)
    ),
  );

  private subscription?: Subscription;

  constructor(
    private discussionService: DiscussionService,
    private threadService: ThreadService,
    private userSessionService: UserSessionService,
    private getItemByIdService: GetItemByIdService,
  ) {
  }

  ngAfterViewInit(): void {
    this.subscription = this.visible$.pipe(filter(visible => visible)).subscribe(() => {
      this.threadComponent?.scrollDown();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onClose(): void {
    this.discussionService.toggleVisibility(false);
  }
}
