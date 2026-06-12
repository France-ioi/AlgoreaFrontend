import { Component, inject, input, output } from '@angular/core';
import { Group } from '../../models/group';
import { Router } from '@angular/router';
import { GroupLeaveComponent } from '../group-leave/group-leave.component';

import { IsCurrentUserMemberPipe } from '../../models/group-membership';

@Component({
  selector: 'alg-group-overview',
  templateUrl: './group-overview.component.html',
  styleUrls: [ './group-overview.component.scss' ],
  imports: [
    GroupLeaveComponent,
    IsCurrentUserMemberPipe,
  ]
})
export class GroupOverviewComponent {
  private router = inject(Router);

  groupRefreshRequired = output<void>();
  leftGroup = output<void>();

  group = input.required<Group>();

  onLeave(): void {
    if (this.group().isPublic) {
      this.groupRefreshRequired.emit();
      return;
    }
    this.leftGroup.emit();
    void this.router.navigate([ '/groups/mine' ]);
  }

}
