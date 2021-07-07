import { Component, OnDestroy } from '@angular/core';
import { ConfirmationService, SortEvent } from 'primeng/api';
import { ReplaySubject, Subject } from 'rxjs';
import { distinctUntilChanged, startWith, switchMap } from 'rxjs/operators';
import { GroupMembership, JoinedGroupsService } from 'src/app/core/http-services/joined-groups.service';
import { NO_SORT, sortEquals, multisortEventToOptions, SortOptions } from 'src/app/shared/helpers/sort-options';
import { mapToFetchState } from 'src/app/shared/operators/state';
import { GroupLeaveService } from 'src/app/core/http-services/group-leave.service';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';

@Component({
  selector: 'alg-joined-group-list',
  templateUrl: './joined-group-list.component.html',
  styleUrls: [ './joined-group-list.component.scss' ]
})
export class JoinedGroupListComponent implements OnDestroy {
  private refresh$ = new Subject<void>();
  private readonly sort$ = new ReplaySubject<SortOptions>(1);
  readonly state$ = this.sort$.pipe(
    startWith(NO_SORT),
    distinctUntilChanged(sortEquals),
    switchMap(sort => this.joinedGroupsService.getJoinedGroups(sort)),
    mapToFetchState({ resetter: this.refresh$.asObservable() }),
  );

  constructor(private joinedGroupsService: JoinedGroupsService,
              private groupLeaveService: GroupLeaveService,
              private confirmationService: ConfirmationService,
              private actionFeedbackService: ActionFeedbackService) {}

  ngOnDestroy(): void {
    this.sort$.complete();
  }

  onCustomSort(event: SortEvent): void {
    const sort = multisortEventToOptions(event);
    if (sort) this.sort$.next(sort);
  }

  onGroupLeaveClick(event: Event, membership: GroupMembership): void {
    this.confirmationService.confirm({
      target: event.target || undefined,
      key: 'commonPopup',
      message: $localize`Are you sure you want to leave this group?`,
      header: $localize`Confirm Action`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: $localize`Yes, leave group`,
      accept: () => {
        this.leaveGroup(membership);
      },
      rejectLabel: $localize`No`,
    });
  }

  leaveGroup(membership: GroupMembership): void {
    const groupId = membership.group.id;
    const groupName = membership.group.name;
    this.groupLeaveService.leave(groupId)
      .subscribe({
        next: () => {
          this.refresh();
          this.actionFeedbackService.success($localize`You have left "${groupName}"`);
        },
        error: _err => {
          this.actionFeedbackService.error($localize`Failed to leave "${groupName}"`);
        }
      });
  }

  refresh(): void {
    this.refresh$.next();
  }

}
