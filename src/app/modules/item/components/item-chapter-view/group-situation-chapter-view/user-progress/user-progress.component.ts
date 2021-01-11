import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { Group } from 'src/app/modules/group/http-services/get-group-by-id.service';
import { Item } from 'src/app/modules/item/http-services/get-item-by-id.service';
import { GetGroupPermissionsService } from 'src/app/shared/http-services/get-group-permissions.service';
import { Permissions } from '../../../permissions-edit-dialog/permissions-edit-dialog.component';
import { TypeFilter } from '../composition-filter/composition-filter.component';
import { Progress } from '../group-situation-chapter-view.component';

@Component({
  selector: 'alg-user-progress',
  templateUrl: './user-progress.component.html',
  styleUrls: [ './user-progress.component.scss' ]
})
export class UserProgressComponent implements OnChanges, OnDestroy {

  @Input() title?: string;

  @Input() targetGroupId?: string;
  @Input() watchedGroup?: Group;
  @Input() item?: Item;
  @Input() userProgress?: Progress;
  @Input() targetType: TypeFilter = 'Users';

  state: 'success'|'in-progress'|'no-score'|'not-started' = 'no-score';

  canAccess = false;

  permissions: Permissions = {
    can_view: 'none',
    can_enter_from: new Date(),
    can_enter_until: new Date(),
    can_grant_view: 'none',
    can_watch: 'none',
    can_edit: 'none',
    can_make_session_official: false,
    is_owner: true,
  };

  dialog: 'loading'|'opened'|'closed' = 'closed';

  private subscription?: Subscription;

  constructor(private getGroupPermissionsService: GetGroupPermissionsService) {}

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.userProgress || !this.watchedGroup || !this.item) return;

    if (this.userProgress.validated || this.userProgress.score === 100) this.state = 'success';
    else if (this.userProgress.score > 0) this.state = 'in-progress';
    else if (this.userProgress.score === 0 && this.userProgress.timeSpent > 0) this.state = 'no-score';
    else this.state = 'not-started';

    this.canAccess = true;// this.watchedGroup.current_user_can_grant_group_access && this.item.permissions.can_grant_view !== 'none';
  }

  onClickAccess(): void {
    if (!this.watchedGroup || !this.targetGroupId || !this.item) return;

    this.dialog = 'loading';
    this.subscription?.unsubscribe();
    this.subscription = this.getGroupPermissionsService.getPermissions(this.watchedGroup.id, this.targetGroupId, this.item.id)
      .subscribe(permissions => {
        this.permissions = {
          can_view: permissions.can_view.granted_only_group,
          can_grant_view: permissions.can_grant_view.granted_only_group,
          can_watch: permissions.can_watch.granted_only_group,
          can_edit: permissions.can_edit.granted_only_group,
          can_enter_until: new Date(permissions.can_enter_until.granted_only_group),
          can_enter_from: new Date(permissions.can_enter_from.granted_only_group),
          is_owner: permissions.is_owner,
          can_make_session_official: permissions.can_make_session_official,
        };
        this.dialog = 'opened';
      });
  }

  onDialogClose(_permissions: Permissions): void {
    this.dialog = 'closed';
    //NOTHING FOR NOW
  }
}
