import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, ViewChild } from '@angular/core';
import { ItemCorePerm } from 'src/app/shared/models/domain/item-permissions';
import { RawGroupRoute } from '../../../../shared/routing/group-route';
import { GroupPermissions, GroupPermissionsService } from '../../../../shared/http-services/group-permissions.service';
import { ReplaySubject, switchMap } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';
import { HttpErrorResponse } from '@angular/common/http';
import { TypeFilter } from '../composition-filter/composition-filter.component';
import { PermissionsEditFormComponent } from '../permissions-edit-dialog-form/permissions-edit-form.component';
import { mapToFetchState } from '../../../../shared/operators/state';

@Component({
  selector: 'alg-permissions-edit-dialog[currentUserPermissions][item][group]',
  templateUrl: './permissions-edit-dialog.component.html',
  styleUrls: [ './permissions-edit-dialog.component.scss' ]
})
export class PermissionsEditDialogComponent implements OnDestroy, OnChanges {
  @Output() close = new EventEmitter<boolean>();

  @Input() visible = true;
  @Input() currentUserPermissions!: ItemCorePerm;
  @Input() item!: { id: string, string: { title: string | null } };
  @Input() group!: RawGroupRoute;
  @Input() sourceGroup?: RawGroupRoute;

  @ViewChild(PermissionsEditFormComponent) permissionsEditForm?: PermissionsEditFormComponent;

  params$ = new ReplaySubject<{ sourceGroupId: string, groupId: string, itemId: string }>(1);
  state$ = this.params$.pipe(
    switchMap(params =>
      this.groupPermissionsService.getPermissions(params.sourceGroupId, params.groupId, params.itemId).pipe(
        map(permissions => permissions.granted),
      )
    ),
    mapToFetchState(),
    shareReplay(1),
  );

  title = 'Permission editor';
  permissions?: Omit<GroupPermissions,'canEnterFrom'|'canEnterUntil'>;
  updateInProcess = false;
  targetType: TypeFilter = 'Users';

  get disabled(): boolean {
    return !this.permissionsEditForm?.form.dirty || !!this.permissionsEditForm?.form.invalid;
  }

  constructor(
    private groupPermissionsService: GroupPermissionsService,
    private actionFeedbackService: ActionFeedbackService,
  ) {
  }

  ngOnDestroy(): void {
    this.params$.complete();
  }

  ngOnChanges(): void {
    if (this.sourceGroup?.isUser) {
      throw new Error('Unexpected: Source group must not be a user');
    }

    if (this.group.isUser && !this.sourceGroup) {
      this.actionFeedbackService.unexpectedError();
      return;
    }

    this.targetType = this.group.isUser ? 'Users' : 'Groups';
    this.params$.next({
      sourceGroupId: this.sourceGroup?.id ?? this.group.id,
      groupId: this.group.id,
      itemId: this.item.id,
    });
  }

  onPermissionsDialogSave(permissions: Partial<GroupPermissions>): void {
    if (this.sourceGroup?.isUser) {
      throw new Error('Unexpected: Source group must not be a user');
    }

    if (this.group.isUser && !this.sourceGroup) {
      this.actionFeedbackService.unexpectedError();
      return;
    }

    this.updateInProcess = true;
    this.groupPermissionsService.updatePermissions(
      this.sourceGroup?.id ?? this.group.id,
      this.group.id,
      this.item.id,
      permissions,
    )
      .subscribe({
        next: _res => {
          this.updateInProcess = false;
          this.actionFeedbackService.success($localize`:@@permissionsUpdated:Permissions successfully updated.`);
          this.closeDialog(true);
        },
        error: err => {
          this.updateInProcess = false;
          this.actionFeedbackService.unexpectedError();
          if (!(err instanceof HttpErrorResponse)) throw err;
        },
      });
  }

  onAccept(): void {
    this.permissionsEditForm?.accept();
  }

  onCancel(): void {
    this.closeDialog();
  }

  closeDialog(changed = false): void {
    this.close.emit(changed);
  }
}
