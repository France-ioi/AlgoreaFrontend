import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { Observable, of } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, startWith, switchMap } from 'rxjs/operators';
import { CheckLoginService } from 'src/app/data-access/check-login.service';
import { CurrentUserHttpService } from 'src/app/data-access/current-user.service';
import { GroupMembership, JoinedGroupsService } from 'src/app/data-access/joined-groups.service';
import { NO_SORT } from 'src/app/data-access/sort-options';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { UserSessionService } from 'src/app/services/user-session.service';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { errorState, fetchingState, readyState } from 'src/app/utils/state';
import {
  DeletePlatformUserDialogComponent,
  DeletePlatformUserDialogData,
} from './delete-platform-user-dialog.component';

type LoginCheck =
  | { kind: 'absent' }
  | { kind: 'pending' }
  | { kind: 'matched' }
  | { kind: 'mismatched' }
  | { kind: 'failed' };

@Component({
  selector: 'alg-delete-platform-user',
  templateUrl: './delete-platform-user.component.html',
  styleUrl: './delete-platform-user.component.scss',
  imports: [
    ButtonComponent,
    RouterLink,
  ],
})
export class DeletePlatformUserComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(Dialog);
  private destroyRef = inject(DestroyRef);
  private userSession = inject(UserSessionService);
  private joinedGroups = inject(JoinedGroupsService);
  private checkLogin = inject(CheckLoginService);
  private currentUserHttp = inject(CurrentUserHttpService);
  private actionFeedback = inject(ActionFeedbackService);

  private readonly profile = toSignal(this.userSession.userProfile$);
  private readonly deletionRefused = signal(false);

  private readonly memberships = toSignal(
    this.joinedGroups.getJoinedGroups(NO_SORT).pipe(
      map(data => readyState(data)),
      catchError((error: unknown) => of(errorState(error))),
      startWith(fetchingState<GroupMembership[]>()),
    ),
    { requireSync: true },
  );

  private readonly loginCheck = toSignal(
    this.route.queryParamMap.pipe(
      map(params => params.get('user_id')),
      distinctUntilChanged(),
      switchMap(userId => this.watchLogin(userId)),
    ),
    { initialValue: { kind: 'pending' } satisfies LoginCheck },
  );

  readonly showButton = computed(() => {
    const kind = this.loginCheck().kind;
    return kind === 'absent' || kind === 'matched';
  });

  readonly showMismatch = computed(() => this.loginCheck().kind === 'mismatched');

  readonly showLockedReason = computed(() => {
    if (this.deletionRefused()) return true;
    const memberships = this.memberships();
    return memberships.isReady && memberships.data.some(membership => membership.isMembershipLocked);
  });

  onDelete(): void {
    if (!this.canOpenDialog()) return;
    const login = this.profile()?.login;
    if (login === undefined) return;

    this.dialog.open<boolean, DeletePlatformUserDialogData>(DeletePlatformUserDialogComponent, {
      data: { login },
    }).closed.pipe(
      filter(confirmed => confirmed === true),
      switchMap(() => this.currentUserHttp.delete()),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => this.leaveAfterDeletion(),
      error: (err: unknown) => this.onDeleteFailed(err),
    });
  }

  private canOpenDialog(): boolean {
    if (!this.showButton()) return false;
    if (this.memberships().isFetching) return false;
    if (this.showLockedReason()) return false;
    return true;
  }

  private watchLogin(userId: string | null): Observable<LoginCheck> {
    if (!userId) return of({ kind: 'absent' });
    return this.checkLogin.check(userId).pipe(
      map(matched => ({ kind: matched ? 'matched' as const : 'mismatched' as const })),
      catchError(() => {
        this.actionFeedback.unexpectedError();
        return of<LoginCheck>({ kind: 'failed' });
      }),
      startWith<LoginCheck>({ kind: 'pending' }),
    );
  }

  private leaveAfterDeletion(): void {
    // Logout even if My groups cannot be opened: the platform user is already gone.
    void this.router.navigateByUrl('/groups/mine')
      .catch(() => false)
      .then(() => this.userSession.logout());
  }

  private onDeleteFailed(err: unknown): void {
    if (err instanceof HttpErrorResponse && err.status === 403) {
      this.deletionRefused.set(true);
      return;
    }
    // Unlink runs after the platform user is already deleted.
    if (isLoginModuleUnlinkFailure(err)) {
      this.leaveAfterDeletion();
      return;
    }
    this.actionFeedback.unexpectedError();
  }
}

function isLoginModuleUnlinkFailure(err: unknown): boolean {
  if (!(err instanceof HttpErrorResponse) || err.status !== 500) return false;
  const body: unknown = err.error;
  if (typeof body !== 'object' || body === null || !('error_text' in body)) return false;
  const errorText = body.error_text;
  return typeof errorText === 'string' && errorText.toLowerCase().includes('login module failed');
}
