import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';
import { GetGroupMembersService, Member } from '../../http-services/get-group-members.service';

interface MemberAddition {
  memberSinceText: string,
}

@Component({
  selector: 'alg-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: [ './user-list.component.scss' ]
})
export class UserListComponent implements OnChanges {

  @Input() group? : Group;
  state: 'loading' | 'error' | 'empty' | 'ready' = 'loading';

  members: (Member&MemberAddition)[] = [];

  constructor(private getGroupMembersService: GetGroupMembersService) { }

  ngOnChanges(_changes: SimpleChanges): void {
    this.reloadData();
  }

  private reloadData(): void {
    if (this.group) {
      this.state = 'loading';

      this.getGroupMembersService.getGroupMembers(this.group.id)
        .subscribe(
          members => {
            const dateFormatter = new Intl.DateTimeFormat('fr');

            this.members = members.map(member => ({
              ...member,
              memberSinceText: member.memberSince === null ? '' : dateFormatter.format(member.memberSince)
            }));

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
}
