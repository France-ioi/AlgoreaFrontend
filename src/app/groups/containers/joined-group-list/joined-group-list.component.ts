import { Component, OnDestroy, signal } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';
import { distinctUntilChanged, filter, startWith, switchMap } from 'rxjs/operators';
import { GroupMembership, JoinedGroupsService } from 'src/app/data-access/joined-groups.service';
import { NO_SORT, sortEquals, multisortEventToOptions, SortOptions } from 'src/app/data-access/sort-options';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { GroupLeaveService } from 'src/app/data-access/group-leave.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { RouterLink } from '@angular/router';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { ConfirmationModalService } from 'src/app/services/confirmation-modal.service';
import {
  CdkCell,
  CdkCellDef,
  CdkColumnDef,
  CdkHeaderCell,
  CdkHeaderCellDef,
  CdkHeaderRow,
  CdkHeaderRowDef,
  CdkNoDataRow,
  CdkRow,
  CdkRowDef,
  CdkTable
} from '@angular/cdk/table';
import { TableSortDirective } from 'src/app/ui-components/table-sort/table-sort.directive';
import { SortEvent, TableSortHeaderComponent } from 'src/app/ui-components/table-sort/table-sort-header/table-sort-header.component';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';

@Component({
  selector: 'alg-joined-group-list',
  templateUrl: './joined-group-list.component.html',
  styleUrls: [ './joined-group-list.component.scss' ],
  imports: [
    ErrorComponent,
    RouterLink,
    AsyncPipe,
    DatePipe,
    ButtonIconComponent,
    CdkTable,
    TableSortDirective,
    CdkHeaderRow,
    CdkHeaderRowDef,
    CdkRow,
    CdkRowDef,
    CdkNoDataRow,
    CdkCell,
    CdkCellDef,
    CdkColumnDef,
    CdkHeaderCell,
    CdkHeaderCellDef,
    TableSortHeaderComponent,
    NgClass,
    TooltipDirective
  ]
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

  displayedColumns = signal([ 'name', 'type', 'memberSince', 'requirePersonalInfoAccessApproval', 'actions' ]);

  constructor(
    private joinedGroupsService: JoinedGroupsService,
    private groupLeaveService: GroupLeaveService,
    private actionFeedbackService: ActionFeedbackService,
    private confirmationModalService: ConfirmationModalService,
  ) {}

  ngOnDestroy(): void {
    this.sort$.complete();
  }

  onSortChange(events: SortEvent[]): void {
    const sortMeta = multisortEventToOptions(events);
    if (sortMeta.length > 0) this.sort$.next(sortMeta);
  }

  onGroupLeaveClick(membership: GroupMembership): void {
    const groupName = membership.group.name;
    this.confirmationModalService.open({
      message: $localize`Are you sure you want to leave this group?`,
      messageIconStyleClass: 'ph-duotone ph-warning-circle alg-validation-error',
      acceptButtonCaption: $localize`Yes, leave group`,
      acceptButtonStyleClass: 'danger',
      rejectButtonCaption: $localize`No`,
    }, { maxWidth: '18.5rem' }).pipe(
      filter(accepted => !!accepted),
      switchMap(() => this.groupLeaveService.leave(membership.group.id)),
    ).subscribe({
      next: () => {
        this.refresh();
        this.actionFeedbackService.success($localize`You have left "${groupName}"`);
      },
      error: _err => {
        this.actionFeedbackService.error($localize`Failed to leave "${groupName}"`);
      },
    });
  }

  refresh(): void {
    this.refresh$.next();
  }

}
