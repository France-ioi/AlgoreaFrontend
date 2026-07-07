import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, output, signal, viewChild } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { MemberListComponent } from '../member-list/member-list.component';
import { GroupCreationService } from '../../data-access/group-creation.service';
import { GroupData } from '../../models/group-data';
import { AddSubGroupComponent } from '../add-sub-group/add-sub-group.component';
import { GroupNoPermissionComponent } from '../group-no-permission/group-no-permission.component';

import { IsCurrentUserManagerPipe } from '../../models/group-management';

export interface GroupChildData {
  id?: string,
  title: string,
  type: 'Class'|'Team'|'Club'|'Friends'|'Other',
}

@Component({
  selector: 'alg-group-sub-groups',
  templateUrl: './group-sub-groups.component.html',
  styleUrl: './group-sub-groups.component.scss',
  imports: [
    MemberListComponent,
    AddSubGroupComponent,
    GroupNoPermissionComponent,
    IsCurrentUserManagerPipe,
  ]
})
export class GroupSubGroupsComponent {
  private groupCreationService = inject(GroupCreationService);
  private actionFeedbackService = inject(ActionFeedbackService);

  addSubGroupComponent = viewChild<AddSubGroupComponent>('addSubGroupComponent');

  groupData = input.required<GroupData>();

  addedGroup = output<void>();
  removedGroup = output<void>();

  private memberList = viewChild<MemberListComponent>('memberList');

  state = signal<'addingGroup' | 'ready'>('ready');

  addGroup(group: GroupChildData): void {
    this.state.set('addingGroup');

    forkJoin({
      parentGroupId: of(this.groupData().group.id),
      childGroupId: group.id ? of(group.id) : this.groupCreationService.create(group.title, group.type),
    }).pipe(switchMap(ids => this.groupCreationService.addSubgroup(ids.parentGroupId, ids.childGroupId))).subscribe({
      next: _ => {
        this.actionFeedbackService.success($localize`Group successfully added as child group`);
        this.memberList()?.fetchRows();
        this.state.set('ready');
        this.addedGroup.emit();
        this.addSubGroupComponent()?.addContentComponent()?.reset();
      },
      error: err => {
        this.state.set('ready');
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      }
    });
  }
}
