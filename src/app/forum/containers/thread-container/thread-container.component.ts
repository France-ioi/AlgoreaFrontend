import { AfterViewInit, Component, computed, DestroyRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, filter, map, of, switchMap } from 'rxjs';
import { ThreadComponent } from '../thread/thread.component';
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
    ButtonIconComponent,
    GroupLinkPipe,
  ]
})
export class ThreadContainerComponent implements AfterViewInit {

  private store = inject(Store);
  private userSessionService = inject(UserSessionService);
  private userService = inject(GetUserService);
  private destroyRef = inject(DestroyRef);

  threadComponent = viewChild(ThreadComponent);

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

  /** Whether the current thread is the user's own thread while observation is active. */
  isOwnThreadWhileObserving$ = combineLatest([
    this.store.select(fromForum.selectThreadId).pipe(filter(isNotNull)),
    this.userSessionService.userProfile$,
    this.store.select(fromObservation.selectIsObserving),
  ]).pipe(
    map(([ threadId, userProfile, isObserving ]) => isObserving && threadId.participantId === userProfile.groupId),
  );

  /** The participant id, for linking to their profile. */
  participantId = computed(() => this.threadHydratedId()?.id.participantId ?? null);

  ngAfterViewInit(): void {
    this.visible$.pipe(
      filter(visible => visible),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.threadComponent()?.scrollDown();
      this.threadComponent()?.focusOnInput();
    });
  }

  onClose(): void {
    this.store.dispatch(fromForum.threadPanelActions.close());
  }
}
