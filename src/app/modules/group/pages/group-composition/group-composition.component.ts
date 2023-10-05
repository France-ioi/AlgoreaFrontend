import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';
import { TypeFilter } from '../../components/group-composition-filter/group-composition-filter.component';
import { MemberListComponent } from '../../components/member-list/member-list.component';
import { ManagementAdditions, withManagementAdditions } from '../../helpers/group-management';
import { Group } from '../../http-services/get-group-by-id.service';
import { GroupCreationService } from '../../http-services/group-creation.service';
import { GroupData } from '../../services/group-datasource.service';
import { AddSubGroupComponent } from '../../components/add-sub-group/add-sub-group.component';
import { GroupNoPermissionComponent } from '../../components/group-no-permission/group-no-permission.component';
import { GroupInviteUsersComponent } from '../../components/group-invite-users/group-invite-users.component';
import { GroupJoinByCodeComponent } from '../../components/group-join-by-code/group-join-by-code.component';
import { NgIf } from '@angular/common';

export interface GroupChildData {
  id?: string,
  title: string,
  type: 'Class'|'Team'|'Club'|'Friends'|'Other',
}

@Component({
  selector: 'alg-group-composition',
  templateUrl: './group-composition.component.html',
  styleUrls: [ './group-composition.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    MemberListComponent,
    AddSubGroupComponent,
    GroupJoinByCodeComponent,
    GroupInviteUsersComponent,
    GroupNoPermissionComponent
  ],
})
export class GroupCompositionComponent implements OnChanges {
  @ViewChild('addSubGroupComponent') addSubGroupComponent?: AddSubGroupComponent;

  @Input() groupData?: GroupData;

  @Output() groupRefreshRequired = new EventEmitter<void>();
  @Output() addedGroup = new EventEmitter<void>();
  @Output() removedGroup = new EventEmitter<void>();

  groupWithPermissions?: Group & ManagementAdditions;

  @ViewChild('memberList') private memberList?: MemberListComponent;

  state: 'addingGroup' | 'ready' = 'ready';

  constructor(
    private groupCreationService: GroupCreationService,
    private actionFeedbackService: ActionFeedbackService,
  ) {}

  ngOnChanges(): void {
    this.groupWithPermissions = this.groupData ? withManagementAdditions(this.groupData.group) : undefined;
  }

  refreshGroupInfo(): void {
    this.groupRefreshRequired.emit();
  }

  addGroup(group: GroupChildData): void {
    if (!this.groupData) throw Error('Tried to add a subgroup to an undefined group');

    this.state = 'addingGroup';

    forkJoin({
      parentGroupId: of(this.groupData.group.id),
      childGroupId: group.id ? of(group.id) : this.groupCreationService.create(group.title, group.type),
    }).pipe(switchMap(ids => this.groupCreationService.addSubgroup(ids.parentGroupId, ids.childGroupId))).subscribe({
      next: _ => {
        this.actionFeedbackService.success($localize`Group successfully added as child group`);
        this.memberList?.setFilter({ directChildren: true, type: TypeFilter.Groups });
        this.state = 'ready';
        this.addedGroup.emit();
        this.addSubGroupComponent?.addContentComponent?.reset();
      },
      error: err => {
        this.state = 'ready';
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      }
    });
  }

}
