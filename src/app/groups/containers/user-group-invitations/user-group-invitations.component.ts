import { Component, OnDestroy, OnInit } from '@angular/core';
import { merge, of, Subject } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { GridColumn } from 'src/app/ui-components/grid/grid.component';
import { displayResponseToast } from 'src/app/groups/containers/pending-request/pending-request-response-handling';
import { fetchingState, readyState } from 'src/app/utils/state';
import { GetRequestsService, PendingRequest } from '../../data-access/get-requests.service';
import { Action, parseGroupInvitationResults, RequestActionsService } from '../../data-access/request-actions.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { PendingRequestComponent } from '../pending-request/pending-request.component';
import { LoadingComponent } from '../../../ui-components/loading/loading.component';
import { NgIf } from '@angular/common';
import { ErrorComponent } from '../../../ui-components/error/error.component';

@Component({
  selector: 'alg-user-group-invitations',
  templateUrl: './user-group-invitations.component.html',
  styleUrls: [ './user-group-invitations.component.scss' ],
  standalone: true,
  imports: [ PendingRequestComponent, LoadingComponent, NgIf, ErrorComponent ],
})
export class UserGroupInvitationsComponent implements OnDestroy, OnInit {
  requests: PendingRequest[] = [];

  readonly columns: GridColumn[] = [
    { field: 'group.name', header: $localize`TITLE` },
    { field: 'group.type', header: $localize`TYPE` },
    { field: 'at', header: $localize`REQUESTED ON`, sortKey: 'at' },
  ];

  state: 'fetching' | 'processing' | 'ready' | 'fetchingError' = 'fetching';
  currentSort: string[] = [];

  private dataFetching = new Subject<{ sort: string[] }>();

  constructor(
    private getRequestsService: GetRequestsService,
    private requestActionService: RequestActionsService,
    private actionFeedbackService: ActionFeedbackService,
    private currentContentService: CurrentContentService,
  ) {
    this.dataFetching.pipe(
      switchMap(params =>
        merge(
          of(fetchingState()),
          this.getRequestsService.getGroupInvitations(params.sort)
            .pipe(map(readyState))
        )
      )
    ).subscribe({
      next: state => {
        this.state = state.tag;
        if (state.isReady) {
          this.requests = state.data;
        }
      },
      error: _err => {
        this.state = 'fetchingError';
      }
    });
  }

  ngOnInit(): void {
    this.dataFetching.next({ sort: this.currentSort });
  }

  ngOnDestroy(): void {
    this.dataFetching.complete();
  }

  onProcessRequests(params: { data: PendingRequest[], type: Action }): void {
    this.state = 'processing';
    this.requestActionService.processGroupInvitations(params.data.map(r => r.group.id), params.type)
      .subscribe({
        next: result => {
          this.state = 'ready';
          displayResponseToast(this.actionFeedbackService, parseGroupInvitationResults(result), params.type);
          this.dataFetching.next({ sort: this.currentSort });
          this.currentContentService.forceNavMenuReload();
        },
        error: err => {
          this.state = 'ready';
          this.actionFeedbackService.unexpectedError();
          if (!(err instanceof HttpErrorResponse)) throw err;
        }
      });
  }

  onFetch(sort: string[]): void {
    if (JSON.stringify(sort) !== JSON.stringify(this.currentSort)) {
      this.currentSort = sort;
      this.dataFetching.next({ sort: this.currentSort });
    }
  }
}
