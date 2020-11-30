import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { forkJoin, merge, Observable, of, Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Group } from 'src/app/core/components/group-nav-tree/group';
import { fetchingState, isReady, readyState } from 'src/app/shared/helpers/state';
import { GetGroupUserDescendantsService } from 'src/app/shared/http-services/get-group-user-descendants.service';
import { GetGroupUsersProgressService, GroupUsersProgress } from 'src/app/shared/http-services/get-group-users-progress.service';
import { FormattableUser } from 'src/app/shared/pipes/userDisplay';
import { GetItemChildrenService, ItemChild } from '../../../http-services/get-item-children.service';
import { ItemData } from '../../../services/item-datasource.service';

interface Data {
  users: FormattableUser[],
  items: ItemChild[],
  data: (GroupUsersProgress|undefined)[][],
}

@Component({
  selector: 'alg-group-situation-chapter-view',
  templateUrl: './group-situation-chapter-view.component.html',
  styleUrls: [ './group-situation-chapter-view.component.scss' ]
})
export class GroupSituationChapterViewComponent implements OnChanges, OnDestroy {

  @Input() group?: Group;
  @Input() itemData?: ItemData;

  state: 'error' | 'ready' | 'fetching' = 'fetching';

  data: Data = {
    users: [],
    items: [],
    data: [],
  }

  private dataFecthing = new Subject<{ groupId: string, itemId: string, attemptId: string }>();

  constructor(
    private getItemChildrenService: GetItemChildrenService,
    private getGroupUserDescendantsService: GetGroupUserDescendantsService,
    private getGroupUsersProgressService: GetGroupUsersProgressService,
  ) {
    this.dataFecthing.pipe(
      switchMap(params =>
        merge(
          of(fetchingState()),
          this.getData(params.itemId, params.groupId, params.attemptId).pipe(map(readyState))
        )
      )).subscribe(
      state => {
        this.state = state.tag;
        if (isReady(state)) this.data = state.data;
      },
      _err => {
        this.state = 'error';
      }
    );
  }

  ngOnDestroy(): void {
    this.dataFecthing.complete();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.itemData || !this.itemData.currentResult || !this.group) {
      this.state = 'error';
      return;
    }

    this.dataFecthing.next({ groupId: this.group.id, itemId: this.itemData.item.id, attemptId: this.itemData.currentResult.attemptId });
  }

  private getData(itemId: string, groupId: string, attemptId: string): Observable<Data> {
    return forkJoin({
      users: this.getGroupUserDescendantsService.getGroupUserDescendants(groupId),
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
}
