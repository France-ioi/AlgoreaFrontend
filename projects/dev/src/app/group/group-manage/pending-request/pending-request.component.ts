import {
  Component,
  OnInit,
  Input,
  EventEmitter,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { GroupService } from '../../../shared/services/api/group.service';
import { PendingRequest } from '../../../shared/models/pending-request.model';
import { SortEvent } from 'primeng/api/sortevent';

@Component({
  selector: 'app-pending-request',
  templateUrl: './pending-request.component.html',
  styleUrls: ['./pending-request.component.scss'],
})
export class PendingRequestComponent implements OnInit, OnChanges {
  @Input() id;

  columns = [
    { field: 'member_id', header: 'ID' },
    { field: 'joining_user.login', header: 'LOGIN' },
    { field: 'at', header: 'REQUESTED ON' },
  ];
  requests = [];
  panel = [];
  multiSortMeta = [
    { field: 'at', order: -1 },
    { field: 'member_id', order: 1 },
  ];
  prevSortMeta = '-at member_id';

  @Output() onAccept = new EventEmitter<any>();
  @Output() onReject = new EventEmitter<any>();

  groupSwitch = [
    {
      label: 'This group only',
    },
    {
      label: 'All subgroups',
    },
  ];

  _setRequestData(reqs: PendingRequest[]) {
    this.requests = [];

    for (const req of reqs) {
      this.requests.push({
        member_id: req.member_id,
        'joining_user.login': `${req.joining_user.first_name || ''} ${
          req.joining_user.last_name || ''
        } (${req.joining_user.login || ''})`,
        grade:
          req.joining_user && req.joining_user.grade
            ? req.joining_user.grade
            : null,
        at: req.at,
      });
    }
  }

  constructor(private groupService: GroupService) {}

  ngOnInit() {
    this.panel.push({
      name: 'Pending Requests',
      columns: this.columns,
    });
    this.groupService
      .getManagedRequests(this.id)
      .subscribe((reqs: PendingRequest[]) => {
        this._setRequestData(reqs);
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    this.groupService
      .getManagedRequests(this.id)
      .subscribe((reqs: PendingRequest[]) => {
        this._setRequestData(reqs);
      });
  }

  onExpandWidth(e) {}

  onClickAccept(e) {
    this.onAccept.emit(e);
  }

  onClickReject(e) {
    this.onReject.emit(e);
  }

  onCustomSort(event: SortEvent) {
    let diff = false;

    const sortBy = event.multiSortMeta.map((meta) =>
      meta.order === -1 ? `-${meta.field}` : meta.field
    );

    if (sortBy.sort().join(' ') !== this.prevSortMeta) {
      diff = true;
    }

    if (!diff) {
      return;
    }

    this.prevSortMeta = sortBy.sort().join(' ');
    this.groupService
      .getManagedRequests(this.id, sortBy)
      .subscribe((reqs: PendingRequest[]) => {
        this._setRequestData(reqs);
      });
  }
}
