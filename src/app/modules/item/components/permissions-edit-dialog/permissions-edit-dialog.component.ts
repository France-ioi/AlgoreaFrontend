import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { ItemCorePerm } from 'src/app/shared/models/domain/item-permissions';
import { RawGroupRoute } from '../../../../shared/routing/group-route';
import { GroupPermissions, GroupPermissionsService } from '../../../../shared/http-services/group-permissions.service';
import { ReplaySubject, switchMap } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';
import { HttpErrorResponse } from '@angular/common/http';
import { TypeFilter } from '../../helpers/composition-filter';
import { mapToFetchState } from '../../../../shared/operators/state';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';

@Component({
  selector: 'alg-permissions-edit-dialog[currentUserPermissions][item][group][permReceiverName]',
  templateUrl: './permissions-edit-dialog.component.html',
  styleUrls: [ './permissions-edit-dialog.component.scss' ]
})
export class PermissionsEditDialogComponent implements OnDestroy, OnChanges {
  @Output() close = new EventEmitter<boolean>();

  @Input() currentUserPermissions!: ItemCorePerm;
  @Input() item!: { id: string, string: { title: string | null } };
  @Input() group!: RawGroupRoute;
  @Input() sourceGroup?: RawGroupRoute;
  @Input() permReceiverName!: string;
  @Input() permGiverName?: string;

  private params$ = new ReplaySubject<{ sourceGroupId: string, groupId: string, itemId: string }>(1);
  state$ = this.params$.pipe(
    switchMap(params =>
      this.groupPermissionsService.getPermissions(params.sourceGroupId, params.groupId, params.itemId)
    ),
    mapToFetchState(),
    shareReplay(1),
  );

  permissions?: Omit<GroupPermissions,'canEnterFrom'|'canEnterUntil'>;
  updateInProcess = false;
  targetType: TypeFilter = 'Users';

  constructor(
    private groupPermissionsService: GroupPermissionsService,
    private actionFeedbackService: ActionFeedbackService,
    private currentContentService: CurrentContentService,
  ) {
  }

  ngOnDestroy(): void {
    this.params$.complete();
  }

  ngOnChanges(): void {
    if (this.group.isUser && !this.sourceGroup) {
      return;
    }

    if (this.sourceGroup?.isUser) {
      throw new Error('Unexpected: Source group must not be a user');
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
      throw new Error('Unexpected: A user group must be provided with source group');
    }

    this.updateInProcess = true;
    this.groupPermissionsService.updatePermissions(
      this.sourceGroup?.id ?? this.group.id,
      this.group.id,
      this.item.id,
      permissions,
    )
      .subscribe({
        next: () => {
          this.updateInProcess = false;
          this.actionFeedbackService.success($localize`:@@permissionsUpdated:Permissions successfully updated.`);
          this.currentContentService.forceNavMenuReload();
          this.closeDialog(true);
        },
        error: err => {
          this.updateInProcess = false;
          this.actionFeedbackService.unexpectedError();
          this.currentContentService.forceNavMenuReload();
          if (!(err instanceof HttpErrorResponse)) throw err;
        },
      });
  }

  onCancel(): void {
    this.closeDialog();
  }

  closeDialog(changed = false): void {
    this.close.emit(changed);
  }
}
