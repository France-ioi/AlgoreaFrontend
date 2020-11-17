import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { SortEvent } from 'primeng/api';
import { Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { GridComponent } from 'src/app/modules/shared-components/components/grid/grid.component';
import { Group } from '../../http-services/get-group-by-id.service';
import { GetGroupMembersService, Member } from '../../http-services/get-group-members.service';

@Component({
  selector: 'alg-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: [ './user-list.component.scss' ]
})
export class UserListComponent implements OnChanges {

  @Input() group? : Group;
  state: 'loading' | 'error' | 'ready' = 'loading';

  currentSort: string[] = [];

  members: Member[] = [];

  @ViewChild('grid') private grid?: GridComponent;

  private dataFetching = new Subject<string[]>();

  constructor(private getGroupMembersService: GetGroupMembersService) {
    this.dataFetching.pipe(
      switchMap(sort => {
        if (this.group) {
          if (sort === []) this.state = 'loading';

          return this.getGroupMembersService.getGroupMembers(this.group.id, sort);
        } else {
          this.state = 'error';
          return [];
        }
      })
    ).subscribe(
      members => {
        if (this.state !== 'error') {
          this.members = members;
          this.state = 'ready';
        }
      },
      _err => {
        this.state = 'error';
      });
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.dataFetching.next([]);
    this.grid?.reset();
  }

  onCustomSort(event: SortEvent): void {
    const sortMeta = event.multiSortMeta?.map(meta => (meta.order === -1 ? `-${meta.field}` : meta.field));

    if (sortMeta && JSON.stringify(sortMeta) !== JSON.stringify(this.currentSort)) {
      this.currentSort = sortMeta;
      this.dataFetching.next(sortMeta);
    }
  }
}
