import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { defer, Observable, of, ReplaySubject } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { ConfirmationModalService } from 'src/app/services/confirmation-modal.service';
import { GroupUsersService, parseResults } from '../../data-access/group-users.service';
import { RemoveGroupService } from '../../data-access/remove-group.service';
import { RemoveSubgroupService } from '../../data-access/remove-subgroup.service';
import { GroupChild } from '../../data-access/get-group-children.service';
import { GroupMembers } from '../../data-access/get-group-members.service';
import { displayResponseToast } from './user-removal-response-handling';
import { displayGroupRemovalResponseToast } from './group-removal-response-handling';

type Member = GroupMembers[number];

function getSelectedGroupChildCaptions(selection: GroupChild[]): string {
  return selection.map(selected => selected.name).join(', ');
}

export interface MemberListRemovalCallbacks {
  unselectAll: () => void,
  fetchRows: () => void,
  onRemovedGroup: () => void,
}

@Injectable()
export class MemberListRemovalService {
  private groupUsersService = inject(GroupUsersService);
  private actionFeedbackService = inject(ActionFeedbackService);
  private confirmationModalService = inject(ConfirmationModalService);
  private removeGroupService = inject(RemoveGroupService);
  private removeSubgroupService = inject(RemoveSubgroupService);
  private destroyRef = inject(DestroyRef);

  removeUsers(
    groupId: string,
    selection: Member[],
    removalInProgress$: ReplaySubject<boolean>,
    callbacks: MemberListRemovalCallbacks,
  ): void {
    if (selection.length === 0) {
      throw new Error('Unexpected: Missed selected members');
    }

    const selectedMemberIds = selection.map(member => member.id);

    removalInProgress$.next(true);
    this.groupUsersService.removeUsers(groupId, selectedMemberIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          displayResponseToast(this.actionFeedbackService, parseResults(result));
          callbacks.unselectAll();
          callbacks.fetchRows();
          removalInProgress$.next(false);
        },
        error: err => {
          removalInProgress$.next(false);
          this.actionFeedbackService.unexpectedError();
          if (!(err instanceof HttpErrorResponse)) throw err;
        }
      });
  }

  removeGroupsOrSubgroups(
    selectedGroupChildren: GroupChild[],
    groupId: string,
    removalInProgress$: ReplaySubject<boolean>,
    callbacks: MemberListRemovalCallbacks,
  ): void {
    const selectedGroupChildIds = selectedGroupChildren.map(g => g.id);
    const isSubgroupsEmpty = selectedGroupChildren.every(g => g.isEmpty);
    const selectedCaptions = getSelectedGroupChildCaptions(selectedGroupChildren);

    removalInProgress$.next(true);

    const confirmRemoveGroup$ = defer(() => this.confirmationModalService.open({
      message: $localize`Are you sure you want to permanently delete ${selectedCaptions}?
        This operation cannot be undone.`,
      acceptIcon: 'ph-bold ph-check',
      acceptButtonStyleClass: 'danger',
      messageIconStyleClass: 'ph-duotone ph-warning-circle alg-validation-error',
    }, { maxWidth: '37.5rem' }).pipe(filter(accepted => !!accepted)));

    const confirmRemoveSubgroups$ = defer(() => this.confirmationModalService.open({
      message: $localize`By removing ${selectedCaptions} from the group, you may lose
        manager access to them (if no explicit permission or through other parent group). Are you sure you want to proceed?`,
      acceptIcon: 'ph-bold ph-check',
      acceptButtonStyleClass: 'danger',
      messageIconStyleClass: 'ph-duotone ph-warning-circle alg-validation-error',
    }, { maxWidth: '37.5rem' }).pipe(filter(accepted => !!accepted)));

    const proceedRemoving$: Observable<boolean | undefined> = isSubgroupsEmpty ? this.confirmationModalService.open({
      message: selectedGroupChildren.length === 1 ?
        $localize`Do you also want to delete the group?` :
        $localize`These groups are all empty. Do you also want to delete them?`,
      acceptIcon: 'ph-bold ph-check',
      acceptButtonStyleClass: 'danger',
      messageIconStyleClass: 'ph-duotone ph-warning-circle alg-validation-error',
    }).pipe(filter(accepted => accepted !== undefined)) : of(undefined);

    proceedRemoving$.pipe(
      switchMap(allowToRemoveGroup => (
        allowToRemoveGroup === true
          ? confirmRemoveGroup$.pipe(switchMap(() => this.removeGroupService.removeBatch(selectedGroupChildIds)))
          : confirmRemoveSubgroups$.pipe(switchMap(() => this.removeSubgroupService.removeBatch(groupId, selectedGroupChildIds)))
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: response => {
        displayGroupRemovalResponseToast(this.actionFeedbackService, response);
        callbacks.unselectAll();
        callbacks.fetchRows();
        removalInProgress$.next(false);
        callbacks.onRemovedGroup();
      },
      error: err => {
        removalInProgress$.next(false);
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      },
      complete: () => removalInProgress$.next(false)
    });
  }
}
