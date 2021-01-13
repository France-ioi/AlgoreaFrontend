import { Component, OnDestroy, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { merge, of, Subject } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { GridColumn } from 'src/app/modules/shared-components/components/grid/grid.component';
import {
  displayResponseToast,
  processRequestError
} from 'src/app/modules/group/components/pending-request/pending-request-response-handling';
import { fetchingState, readyState, isReady } from 'src/app/shared/helpers/state';
import { GetRequestsService, PendingRequest } from '../../http-services/get-requests.service';
import { Action, parseResults, RequestActionsService } from '../../http-services/request-actions.service';

@Component({
  selector: 'alg-user-group-invitations',
  templateUrl: './user-group-invitations.component.html',
  styleUrls: [ './user-group-invitations.component.scss' ]
})
export class UserGroupInvitationsComponent implements OnDestroy, OnInit {
  requests: PendingRequest[] = [];

  readonly columns: GridColumn[] = [
    { field: 'group.name', header: $localize`TITLE` },
    { field: 'group.type', header: $localize`TYPE` },
    { field: 'at', header: $localize`REQUESTED ON` },
  ];

  state: 'fetching' | 'processing' | 'ready' | 'fetchingError' = 'fetching';
  currentSort: string[] = [];

  private dataFetching = new Subject<{ sort: string[] }>();

  constructor(
    private getRequestsService: GetRequestsService,
    private requestActionService: RequestActionsService,
    private messageService: MessageService,
  ) {
    this.dataFetching.pipe(
      switchMap(params =>
        merge(
          of(fetchingState()),
          this.getRequestsService.getGroupInvitations(params.sort)
            .pipe(map(readyState))
        )
      )
    ).subscribe(
      state => {
        this.state = state.tag;
        if (isReady(state)) {
          this.requests = state.data;
        }
      },
      _err => {
        this.state = 'fetchingError';
      }
    );
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
      .subscribe(
        result => {
          this.state = 'ready';
          displayResponseToast(this.messageService, parseResults(result), params.type);
          this.dataFetching.next({ sort: this.currentSort });
        },
        _err => {
          this.state = 'ready';
          processRequestError(this.messageService);
        }
      );
  }

  onFetch(sort: string[]): void {
    if (JSON.stringify(sort) !== JSON.stringify(this.currentSort)) {
      this.currentSort = sort;
      this.dataFetching.next({ sort: this.currentSort });
    }
  }
}
