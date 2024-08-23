import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { ItemCorePerm } from 'src/app/items/models/item-permissions';
import { RawGroupRoute, isUser } from 'src/app/models/routing/group-route';
import { GroupPermissions, GroupPermissionsService } from 'src/app/data-access/group-permissions.service';
import { ReplaySubject, switchMap } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { HttpErrorResponse } from '@angular/common/http';
import { TypeFilter } from '../../models/composition-filter';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { PermissionsEditFormComponent } from '../permissions-edit-dialog-form/permissions-edit-form.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { NgIf, AsyncPipe } from '@angular/common';
import { SharedModule } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { GroupIsUserPipe } from 'src/app/pipes/groupIsUser';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'alg-permissions-edit-dialog[currentUserPermissions][item][group][permReceiverName]',
  templateUrl: './permissions-edit-dialog.component.html',
  styleUrls: [ './permissions-edit-dialog.component.scss' ],
  standalone: true,
  imports: [
    DialogModule,
    SharedModule,
    NgIf,
    ErrorComponent,
    LoadingComponent,
    PermissionsEditFormComponent,
    AsyncPipe,
    GroupIsUserPipe,
    ButtonModule,
  ],
})
export class PermissionsEditDialogComponent implements OnDestroy, OnChanges {
  @Output() close = new EventEmitter<boolean>();

  @Input() currentUserPermissions!: ItemCorePerm;
  @Input() item!: { id: string, requiresExplicitEntry: boolean, string: { title: string | null } };
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
    if (isUser(this.group) && !this.sourceGroup) {
      return;
    }

    if (this.sourceGroup && isUser(this.sourceGroup)) {
      throw new Error('Unexpected: Source group must not be a user');
    }

    this.targetType = isUser(this.group) ? 'Users' : 'Groups';
    this.params$.next({
      sourceGroupId: this.sourceGroup?.id ?? this.group.id,
      groupId: this.group.id,
      itemId: this.item.id,
    });
  }

  onPermissionsDialogSave(permissions: Partial<GroupPermissions>): void {
    if (this.sourceGroup && isUser(this.sourceGroup)) {
      throw new Error('Unexpected: Source group must not be a user');
    }

    if (isUser(this.group) && !this.sourceGroup) {
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
