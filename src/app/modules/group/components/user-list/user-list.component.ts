import { Component, Input, OnInit } from '@angular/core';
import { SortEvent } from 'primeng/api';
import { BehaviorSubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Group } from '../../http-services/get-group-by-id.service';
import { GetGroupMembersService, Member } from '../../http-services/get-group-members.service';

@Component({
  selector: 'alg-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: [ './user-list.component.scss' ]
})
export class UserListComponent implements OnInit {

  @Input() group? : Group;
  state: 'loading' | 'error' | 'empty' | 'ready' = 'loading';
  currentSort: string[] = [];

  members: Member[] = [];

  private dataFetching = new BehaviorSubject<'Reload'|'Sort'>('Reload');

  constructor(private getGroupMembersService: GetGroupMembersService) { }

  ngOnInit(): void {
    this.dataFetching.pipe(
      switchMap(mode => {
        if (this.group) {
          if (mode === 'Reload')
            this.state = 'loading';

          return this.getGroupMembersService.getGroupMembers(this.group.id, this.currentSort);
        } else {
          throw new Error('group is null');
        }
      })
    ).subscribe(
      members => {
        this.members = members;

        if (this.members.length === 0) this.state = 'empty';
        else this.state = 'ready';
      },
      _err => {
        this.state = 'error';
      });
  }

  onCustomSort(event: SortEvent): void {
    const sortMeta = event.multiSortMeta?.map(meta => (meta.order === -1 ? `-${meta.field}` : meta.field));

    if (sortMeta && JSON.stringify(sortMeta) !== JSON.stringify(this.currentSort)) {
      this.currentSort = sortMeta;
      this.dataFetching.next('Sort');
    }
  }
}
