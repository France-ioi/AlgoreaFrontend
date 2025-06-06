import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Group } from '../../models/group';
import { Router } from '@angular/router';
import { GroupLeaveComponent } from '../group-leave/group-leave.component';
import { NgIf } from '@angular/common';
import { IsCurrentUserMemberPipe } from '../../models/group-membership';

@Component({
  selector: 'alg-group-overview',
  templateUrl: './group-overview.component.html',
  styleUrls: [ './group-overview.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    GroupLeaveComponent,
    IsCurrentUserMemberPipe,
  ],
})
export class GroupOverviewComponent {
  @Output() groupRefreshRequired = new EventEmitter<void>();
  @Output() leftGroup = new EventEmitter<void>();

  @Input() group?: Group;

  constructor(private router: Router) {}

  onLeave(): void {
    if (this.group?.isPublic) {
      this.groupRefreshRequired.emit();
      return;
    }
    this.leftGroup.emit();
    void this.router.navigate([ '/groups/mine' ]);
  }

}
