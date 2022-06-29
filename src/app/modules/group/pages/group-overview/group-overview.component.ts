import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';
import { Router } from '@angular/router';

@Component({
  selector: 'alg-group-overview',
  templateUrl: './group-overview.component.html',
  styleUrls: [ './group-overview.component.scss' ],
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
