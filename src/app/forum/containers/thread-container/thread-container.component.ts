import { AfterViewInit, Component, computed, inject, Input, OnDestroy, ViewChild } from '@angular/core';
import { combineLatest, filter, map, of, Subscription, switchMap } from 'rxjs';
import { ThreadComponent } from '../thread/thread.component';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { fromForum } from 'src/app/forum/store';
import { Store } from '@ngrx/store';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { GroupLinkPipe } from 'src/app/pipes/groupLink';
import { UserSessionService } from 'src/app/services/user-session.service';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { GetUserService } from 'src/app/groups/data-access/get-user.service';
import { formatUser } from 'src/app/groups/models/user';
import { fromObservation } from 'src/app/store/observation';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'alg-thread-container',
  templateUrl: './thread-container.component.html',
  styleUrls: [ './thread-container.component.scss' ],
  imports: [
    RouterLink,
    ThreadComponent,
    AsyncPipe,
    RouteUrlPipe,
    ButtonIconComponent,
    GroupLinkPipe,
  ]
})
export class ThreadContainerComponent implements AfterViewInit, OnDestroy {

  private store = inject(Store);
  private userSessionService = inject(UserSessionService);
  private userService = inject(GetUserService);

  @ViewChild(ThreadComponent) threadComponent?: ThreadComponent;

  @Input() topCompensation = 0;

  visible$ = this.store.select(fromForum.selectVisible);
  threadHydratedId = this.store.selectSignal(fromForum.selectThreadHydratedId);

  /** Name of the thread participant for the header pill. Null if it's the user's own thread. */
  participantName$ = combineLatest([
    this.store.select(fromForum.selectThreadId).pipe(filter(isNotNull)),
    this.userSessionService.userProfile$,
    this.store.select(fromObservation.selectObservedGroupInfo),
  ]).pipe(
    switchMap(([ threadId, userProfile, observedGroup ]) => {
      if (threadId.participantId === userProfile.groupId) return of(null);
      if (observedGroup && observedGroup.route.id === threadId.participantId) return of(observedGroup.name);
      return this.userService.getForId(threadId.participantId).pipe(
        map(user => formatUser(user)),
        catchError(() => of($localize`Unknown user`)),
      );
    }),
  );

  /** The participant id, for linking to their profile. */
  participantId = computed(() => this.store.selectSignal(fromForum.selectThreadId)()?.participantId ?? null);

  private subscription?: Subscription;

  ngAfterViewInit(): void {
    this.subscription = this.visible$.pipe(filter(visible => visible)).subscribe(() => {
      this.threadComponent?.scrollDown();
      this.threadComponent?.focusOnInput();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onClose(): void {
    this.store.dispatch(fromForum.threadPanelActions.close());
  }
}
