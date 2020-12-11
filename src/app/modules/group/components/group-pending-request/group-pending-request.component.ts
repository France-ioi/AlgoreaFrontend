import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { GetRequestsService, PendingRequest } from '../../http-services/get-requests.service';
import { Action, RequestActionsService } from '../../http-services/request-actions.service';
import { GridColumn } from '../../../shared-components/components/grid/grid.component';
import { merge, of, Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { fetchingState, isReady, readyState } from 'src/app/shared/helpers/state';
import { MessageService } from 'primeng/api';
import { displayResponseToast, processRequestError } from 'src/app/modules/group/helpers/response-toast';
import { parseResults, processRequests } from 'src/app/modules/shared-components/components/pending-request/request-processing';

const groupColumn = { field: 'group.name', header: 'GROUP' };

@Component({
  selector: 'alg-group-pending-request',
  templateUrl: './group-pending-request.component.html',
  styleUrls: [ './group-pending-request.component.scss' ],
})
export class GroupPendingRequestComponent implements OnInit, OnChanges, OnDestroy {
  @Input() groupId?: string;
  @Input() showSwitch = true;

  requests: PendingRequest[] = [];

  columns: GridColumn[] = [
    { field: 'user.login', header: 'USER' },
    { field: 'at', header: 'REQUESTED ON' },
  ];
  subgroupSwitchItems = [
    { label: 'This group only', includeSubgroup: false },
    { label: 'All subgroups', includeSubgroup: true }
  ];
  includeSubgroup = false;

  state: 'fetching' | 'processing' | 'ready' | 'fetchingError' = 'fetching';
  currentSort: string[] = [];

  private dataFetching = new Subject<{ groupId?: string, includeSubgroup: boolean, sort: string[] }>();

  constructor(
    private getRequestsService: GetRequestsService,
    private requestActionService: RequestActionsService,
    private messageService: MessageService,
  ) {
    this.dataFetching.pipe(
      switchMap(params =>
        merge(
          of(fetchingState()),
          this.getRequestsService.getGroupPendingRequests(params.groupId, params.includeSubgroup, params.sort)
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
    if (!this.showSwitch) this.columns = [ groupColumn ].concat(this.columns);
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.dataFetching.next({ groupId: this.groupId, includeSubgroup: this.includeSubgroup, sort: this.currentSort });
  }

  ngOnDestroy(): void {
    this.dataFetching.complete();
  }

  onProcessRequests(params: { data: PendingRequest[], type: Action }): void {
    processRequests(
      (groupId: string, memberIds: string[], action: Action) => this.requestActionService.processJoinRequest(groupId, memberIds, action),
      params.type,
      params.data
    )
      .subscribe(
        result => {
          this.state = 'ready';

          displayResponseToast(
            this.messageService,
            parseResults(result),
            params.type === Action.Accept ? 'accept' : 'reject',
            params.type === Action.Accept ? 'accepted' : 'declined'
          );

        },
        _err => {
          this.state = 'ready';
          processRequestError(this.messageService);
        }
      );
  }

  onSubgroupSwitch(selectedIdx: number): void {
    this.includeSubgroup = this.subgroupSwitchItems[selectedIdx].includeSubgroup;

    this.columns = this.columns.filter(elm => elm !== groupColumn);
    if (this.includeSubgroup) this.columns = [ groupColumn ].concat(this.columns);

    this.dataFetching.next({ groupId: this.groupId, includeSubgroup: this.includeSubgroup, sort: this.currentSort });
  }

  onFetch(sort: string[]): void {
    if (JSON.stringify(sort) !== JSON.stringify(this.currentSort)) {
      this.currentSort = sort;
      this.dataFetching.next({ groupId: this.groupId, includeSubgroup: this.includeSubgroup, sort: this.currentSort });
    }
  }
}
