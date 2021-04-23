import { Component, OnDestroy } from '@angular/core';
import { SortEvent } from 'primeng/api';
import { ReplaySubject } from 'rxjs';
import { distinctUntilChanged, startWith, switchMap } from 'rxjs/operators';
import { JoinedGroupsService } from 'src/app/core/http-services/joined-groups.service';
import { NO_SORT, sortEquals, multisortEventToOptions, SortOptions } from 'src/app/shared/helpers/sort-options';
import { mapToFetchState } from 'src/app/shared/operators/state';

@Component({
  selector: 'alg-joined-group-list',
  templateUrl: './joined-group-list.component.html',
  styleUrls: [ './joined-group-list.component.scss' ]
})
export class JoinedGroupListComponent implements OnDestroy {

  private readonly sort$ = new ReplaySubject<SortOptions>(1);
  readonly state$ = this.sort$.pipe(
    startWith(NO_SORT),
    distinctUntilChanged(sortEquals),
    switchMap(sort => this.joinedGroupsService.getJoinedGroups(sort)),
    mapToFetchState(),
  );

  constructor(private joinedGroupsService:JoinedGroupsService) {}

  ngOnDestroy(): void {
    this.sort$.complete();
  }

  onCustomSort(event: SortEvent): void {
    const sort = multisortEventToOptions(event);
    if (sort) this.sort$.next(sort);
  }

}
