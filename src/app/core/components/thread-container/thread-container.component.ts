import { AfterViewInit, Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { DiscussionService } from 'src/app/modules/item/services/discussion.service';
import { combineLatest, distinctUntilChanged, filter, of, Subscription, switchMap } from 'rxjs';
import { ThreadComponent } from '../thread/thread.component';
import { ThreadService } from '../../../modules/item/services/threads.service';
import { GetItemByIdService } from '../../../modules/item/http-services/get-item-by-id.service';
import { isNotNull } from '../../../shared/helpers/null-undefined-predicates';
import { catchError } from 'rxjs/operators';
import { RouteUrlPipe } from 'src/app/shared/pipes/routeUrl';
import { RawItemRoutePipe } from 'src/app/shared/pipes/itemRoute';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { NgIf, AsyncPipe } from '@angular/common';

@Component({
  selector: 'alg-thread-container',
  templateUrl: './thread-container.component.html',
  styleUrls: [ './thread-container.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    RouterLink,
    ButtonModule,
    ThreadComponent,
    AsyncPipe,
    RawItemRoutePipe,
    RouteUrlPipe,
  ],
})
export class ThreadContainerComponent implements AfterViewInit, OnDestroy {
  @ViewChild(ThreadComponent) threadComponent?: ThreadComponent;

  @Input() topCompensation = 0;

  visible$ = this.discussionService.visible$;
  readonly threadItem$ = combineLatest([
    this.threadService.threadId$.pipe(
      filter(isNotNull),
      distinctUntilChanged((x,y) => x?.participantId === y?.participantId && x?.itemId === y?.itemId),
    ),
    this.discussionService.visible$.pipe(filter(visible => visible), distinctUntilChanged()),
  ]).pipe(
    switchMap(([ threadId ]) =>
      this.getItemByIdService.get(threadId.itemId).pipe(catchError(() => of(null)))
    ),
  );

  private subscription?: Subscription;

  constructor(
    private discussionService: DiscussionService,
    private threadService: ThreadService,
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
