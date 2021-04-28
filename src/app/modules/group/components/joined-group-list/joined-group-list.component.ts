import { Component, OnDestroy } from '@angular/core';
import { ConfirmationService, SortEvent } from 'primeng/api';
import { ReplaySubject, Subject } from 'rxjs';
import { distinctUntilChanged, startWith, switchMap, map } from 'rxjs/operators';
import { JoinedGroup, JoinedGroupsService } from 'src/app/core/http-services/joined-groups.service';
import { NO_SORT, sortEquals, multisortEventToOptions, SortOptions } from 'src/app/shared/helpers/sort-options';
import { mapToFetchState } from 'src/app/shared/operators/state';

@Component({
  selector: 'alg-joined-group-list',
  templateUrl: './joined-group-list.component.html',
  styleUrls: [ './joined-group-list.component.scss' ]
})
export class JoinedGroupListComponent implements OnDestroy {
  refresh$ = new Subject();
  private readonly sort$ = new ReplaySubject<SortOptions>(1);
  readonly state$ = this.sort$.pipe(
    startWith(NO_SORT),
    distinctUntilChanged(sortEquals),
    switchMap(sort => this.joinedGroupsService.getJoinedGroups(sort)),
    map(group => group.filter(g => g.group.type !== 'Base')),
    mapToFetchState({ resetter: this.refresh$.asObservable() }),
  );

  constructor(private joinedGroupsService: JoinedGroupsService, private confirmationService: ConfirmationService) {}

  ngOnDestroy(): void {
    this.sort$.complete();
  }

  onCustomSort(event: SortEvent): void {
    const sort = multisortEventToOptions(event);
    if (sort) this.sort$.next(sort);
  }

  onGroupLeaveClick(group: JoinedGroup): void {
    this.confirmationService.confirm({
      message: $localize`Are you sure you want to leave this group?`,
      header: $localize`Confirm Action`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: $localize`Yes, leave group`,
      accept: () => {
        this.leaveGroup(group);
      },
      rejectLabel: $localize`No`,
    });
  }

  leaveGroup(group: JoinedGroup): void {
    const groupId = group.group.id;
    this.joinedGroupsService.leave(groupId)
      .subscribe(() => this.refresh$.next());
  }

}
