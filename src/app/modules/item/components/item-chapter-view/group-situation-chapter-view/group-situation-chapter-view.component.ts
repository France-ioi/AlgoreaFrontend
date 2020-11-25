import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { forkJoin, merge, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Group } from 'src/app/core/components/group-nav-tree/group';
import { fetchingState, isReady, readyState } from 'src/app/shared/helpers/state';
import { GetGroupUserDescendantsService } from 'src/app/shared/http-services/get-group-user-descendants.service';
import { GetGroupUsersProgressService, GroupUsersProgress } from 'src/app/shared/http-services/get-group-users-progress.service';
import { GetItemChildrenService, ItemChild } from '../../../http-services/get-item-children.service';
import { ItemData } from '../../../services/item-datasource.service';

interface User {
  login: string,
  firstName: string|null,
  lastName: string|null,
}

interface Data {
  users: User[],
  items: ItemChild[],
  data: (GroupUsersProgress|undefined)[][],
}

@Component({
  selector: 'alg-group-situation-chapter-view',
  templateUrl: './group-situation-chapter-view.component.html',
  styleUrls: [ './group-situation-chapter-view.component.scss' ]
})
export class GroupSituationChapterViewComponent implements OnChanges {

  @Input() group!: Group;
  @Input() itemData?: ItemData;

  state: 'error' | 'ready' | 'fetching' = 'fetching';

  data: Data = {
    users: [],
    items: [],
    data: [],
  }

  constructor(
    private getItemChildrenService: GetItemChildrenService,
    private getGroupUserDescendantsService: GetGroupUserDescendantsService,
    private getGroupUsersProgressService: GetGroupUsersProgressService,
  ) { }

  getData(itemId: string, groupId: string, attemptId: string): Observable<Data> {
    return forkJoin({
      users: this.getGroupUserDescendantsService.getGroupUserDescendants(this.group.id),
      items: this.getItemChildrenService.get(itemId, attemptId),
      usersProgress: this.getGroupUsersProgressService.getGroupUsersProgress(groupId, [ itemId ])
    }).pipe(
      map(data => ({
        users: data.users.map(user => user.user),
        items: data.items,
        data: data.users.map(user =>
          data.items.map(item =>
            data.usersProgress.find(userProgress => userProgress.itemId === item.id && userProgress.groupId === user.id)
          )
        )
      }))
    );
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.itemData || !this.itemData.currentResult) return;

    merge(
      of(fetchingState()),
      this.getData(this.itemData.item.id, this.group.id, this.itemData.currentResult.attemptId).pipe(map(readyState))
    ).subscribe(
      state => {
        console.log(state);

        this.state = state.tag;
        if (isReady(state)) this.data = state.data;
      },
      _err => {
        this.state = 'error';
      }
    );
  }
}
