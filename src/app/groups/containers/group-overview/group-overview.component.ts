import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Group } from '../../data-access/get-group-by-id.service';
import { Router } from '@angular/router';
import { GroupLeaveComponent } from '../group-leave/group-leave.component';
import { GroupLogViewComponent } from '../group-log-view/group-log-view.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'alg-group-overview',
  templateUrl: './group-overview.component.html',
  styleUrls: [ './group-overview.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    GroupLogViewComponent,
    GroupLeaveComponent,
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
