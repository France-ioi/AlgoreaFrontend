import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { TypeFilter } from '../group-composition-filter/group-composition-filter.component';
import { MemberListComponent } from '../member-list/member-list.component';
import { GroupCreationService } from '../../data-access/group-creation.service';
import { GroupData } from '../../models/group-data';
import { AddSubGroupComponent } from '../add-sub-group/add-sub-group.component';
import { GroupNoPermissionComponent } from '../group-no-permission/group-no-permission.component';
import { GroupInviteUsersComponent } from '../group-invite-users/group-invite-users.component';
import { GroupJoinByCodeComponent } from '../group-join-by-code/group-join-by-code.component';

import { IsCurrentUserManagerPipe } from '../../models/group-management';

export interface GroupChildData {
  id?: string,
  title: string,
  type: 'Class'|'Team'|'Club'|'Friends'|'Other',
}

@Component({
  selector: 'alg-group-composition',
  templateUrl: './group-composition.component.html',
  styleUrls: [ './group-composition.component.scss' ],
  imports: [
    MemberListComponent,
    AddSubGroupComponent,
    GroupJoinByCodeComponent,
    GroupInviteUsersComponent,
    GroupNoPermissionComponent,
    IsCurrentUserManagerPipe,
  ]
})
export class GroupCompositionComponent {
  private groupCreationService = inject(GroupCreationService);
  private actionFeedbackService = inject(ActionFeedbackService);

  @ViewChild('addSubGroupComponent') addSubGroupComponent?: AddSubGroupComponent;

  @Input() groupData?: GroupData;

  @Output() groupRefreshRequired = new EventEmitter<void>();
  @Output() addedGroup = new EventEmitter<void>();
  @Output() removedGroup = new EventEmitter<void>();

  @ViewChild('memberList') private memberList?: MemberListComponent;

  state: 'addingGroup' | 'ready' = 'ready';

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
