import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RawGroupRoute, isUser } from 'src/app/models/routing/group-route';
import { GroupPermissions, GroupPermissionsService } from 'src/app/data-access/group-permissions.service';
import { catchError, of, ReplaySubject, switchMap } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { HttpErrorResponse } from '@angular/common/http';
import { TypeFilter } from '../../models/composition-filter';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { PermissionsEditFormComponent } from '../permissions-edit-dialog-form/permissions-edit-form.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { AsyncPipe } from '@angular/common';
import { GroupIsUserPipe } from 'src/app/pipes/groupIsUser';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ModalComponent } from 'src/app/ui-components/modal/modal.component';
import { ItemCorePerm } from 'src/app/items/models/item-permissions';
import { MessageInfoComponent } from 'src/app/ui-components/message-info/message-info.component';

export interface PermissionsEditDialogParams {
  currentUserPermissions: ItemCorePerm,
  item: { id: string, requiresExplicitEntry: boolean, string: { title: string | null } },
  group: RawGroupRoute,
  permReceiverName: string,
  sourceGroup?: RawGroupRoute,
  permGiverName?: string,
}

@Component({
  selector: 'alg-permissions-edit-dialog',
  templateUrl: './permissions-edit-dialog.component.html',
  styleUrl: './permissions-edit-dialog.component.scss',
  imports: [
    ErrorComponent,
    LoadingComponent,
    PermissionsEditFormComponent,
    AsyncPipe,
    GroupIsUserPipe,
    ModalComponent,
    MessageInfoComponent,
  ]
})
export class PermissionsEditDialogComponent implements OnDestroy, OnInit {
  private groupPermissionsService = inject(GroupPermissionsService);
  private actionFeedbackService = inject(ActionFeedbackService);
  private currentContentService = inject(CurrentContentService);

  params = signal(inject<PermissionsEditDialogParams>(DIALOG_DATA));
  private dialogRef = inject(DialogRef);

  private params$ = new ReplaySubject<{ sourceGroupId: string, groupId: string, itemId: string }>(1);
  state$ = this.params$.pipe(
    switchMap(params =>
      this.groupPermissionsService.getPermissions(params.sourceGroupId, params.groupId, params.itemId)
    ),
    mapToFetchState(),
    shareReplay(1),
  );

  protected hasPath$ = this.params$.pipe(
    switchMap(({ groupId, itemId }) =>
      this.groupPermissionsService.getHasPath(groupId, itemId).pipe(catchError(() => of(null)))),
    shareReplay(1),
  );

  protected readonly updateInProcess = signal(false);
  targetType = computed((): TypeFilter => (isUser(this.params().group) ? 'Users' : 'Groups'));

  ngOnDestroy(): void {
    this.params$.complete();
  }

  ngOnInit(): void {
    if (isUser(this.params().group) && !this.params().sourceGroup) {
      return;
    }

    const sourceGroup = this.params().sourceGroup;
    if (sourceGroup && isUser(sourceGroup)) {
      throw new Error('Unexpected: Source group must not be a user');
    }

    this.params$.next({
      sourceGroupId: this.params().sourceGroup?.id ?? this.params().group.id,
      groupId: this.params().group.id,
      itemId: this.params().item.id,
    });
  }

  onPermissionsDialogSave(permissions: Partial<GroupPermissions>): void {
    const sourceGroup = this.params().sourceGroup;
    if (sourceGroup && isUser(sourceGroup)) {
      throw new Error('Unexpected: Source group must not be a user');
    }

    if (isUser(this.params().group) && !this.params().sourceGroup) {
      throw new Error('Unexpected: A user group must be provided with source group');
    }

    this.updateInProcess.set(true);
    this.groupPermissionsService.updatePermissions(
      this.params().sourceGroup?.id ?? this.params().group.id,
      this.params().group.id,
      this.params().item.id,
      permissions,
    )
      .subscribe({
        next: () => {
          this.updateInProcess.set(false);
          this.actionFeedbackService.success($localize`:@@permissionsUpdated:Permissions successfully updated.`);
          this.currentContentService.forceNavMenuReload();
          this.closeDialog(true);
        },
        error: err => {
          this.updateInProcess.set(false);
          this.actionFeedbackService.unexpectedError();
          this.currentContentService.forceNavMenuReload();
          if (!(err instanceof HttpErrorResponse)) throw err;
        },
      });
  }

  closeDialog(changed = false): void {
    this.dialogRef.close(changed);
  }
}
