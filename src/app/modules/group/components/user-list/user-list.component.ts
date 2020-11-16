import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { Group } from '../../http-services/get-group-by-id.service';
import { GetGroupMembersService, Member } from '../../http-services/get-group-members.service';

@Component({
  selector: 'alg-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: [ './user-list.component.scss' ]
})
export class UserListComponent implements OnChanges, OnDestroy {

  @Input() group? : Group;
  state: 'loading' | 'error' | 'empty' | 'ready' = 'loading';

  members: Member[] = [];

  private subscription?: Subscription;

  constructor(private getGroupMembersService: GetGroupMembersService) { }

  ngOnChanges(_changes: SimpleChanges): void {
    this.reloadData();
  }

  private reloadData(): void {
    if (this.group) {
      this.state = 'loading';
      this.subscription?.unsubscribe();
      this.subscription = this.getGroupMembersService.getGroupMembers(this.group.id)
        .subscribe(
          members => {
            this.members = members;

            if (this.members.length === 0) this.state = 'empty';
            else this.state = 'ready';
          },
          _err => {
            this.state = 'error';
          }
        );
    } else {
      this.state = 'error';
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
