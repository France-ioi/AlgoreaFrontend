import { Component, OnDestroy } from '@angular/core';
import { ConfirmationService, SortEvent, SharedModule } from 'primeng/api';
import { ReplaySubject, Subject } from 'rxjs';
import { distinctUntilChanged, startWith, switchMap } from 'rxjs/operators';
import { GroupMembership, JoinedGroupsService } from 'src/app/data-access/joined-groups.service';
import { NO_SORT, sortEquals, multisortEventToOptions, SortOptions } from 'src/app/data-access/sort-options';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { GroupLeaveService } from 'src/app/data-access/group-leave.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault, AsyncPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'alg-joined-group-list',
  templateUrl: './joined-group-list.component.html',
  styleUrls: [ './joined-group-list.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    ErrorComponent,
    TableModule,
    SharedModule,
    RouterLink,
    NgSwitch,
    NgSwitchCase,
    TooltipModule,
    NgSwitchDefault,
    ButtonModule,
    RippleModule,
    AsyncPipe,
    DatePipe
  ],
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
      icon: 'ph-duotone ph-warning-circle',
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
