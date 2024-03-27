import { Component, OnDestroy, OnInit } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { GetRequestsService, PendingRequest } from '../../data-access/get-requests.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { PendingRequestComponent } from '../pending-request/pending-request.component';
import { LoadingComponent } from '../../../ui-components/loading/loading.component';
import { AsyncPipe, DatePipe, NgClass, NgForOf, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { ErrorComponent } from '../../../ui-components/error/error.component';
import { ProcessGroupInvitationService } from '../../data-access/process-group-invitation.service';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { UserCaptionPipe } from '../../../pipes/userCaption';
import { SortEvent } from 'primeng/api/sortevent';
import { mapToFetchState } from '../../../utils/operators/state';

@Component({
  selector: 'alg-user-group-invitations',
  templateUrl: './user-group-invitations.component.html',
  styleUrls: [ './user-group-invitations.component.scss' ],
  standalone: true,
  imports: [
    PendingRequestComponent,
    LoadingComponent,
    NgIf,
    ErrorComponent,
    ButtonModule,
    DatePipe,
    NgForOf,
    NgSwitchCase,
    TableModule,
    UserCaptionPipe,
    NgSwitch,
    NgSwitchDefault,
    AsyncPipe,
    NgClass,
  ],
})
export class UserGroupInvitationsComponent implements OnInit, OnDestroy {
  currentSort: string[] = [];
  processing = false;

  private groupInvitationsSubject = new ReplaySubject<{ sort: string[] }>();
  state$ = this.groupInvitationsSubject.pipe(
    switchMap(params =>
      this.getRequestsService.getGroupInvitations(params.sort).pipe(
        mapToFetchState(),
      )
    )
  );

  constructor(
    private getRequestsService: GetRequestsService,
    private actionFeedbackService: ActionFeedbackService,
    private currentContentService: CurrentContentService,
    private processGroupInvitationService: ProcessGroupInvitationService,
  ) {}

  ngOnInit(): void {
    this.groupInvitationsSubject.next({ sort: this.currentSort });
  }

  ngOnDestroy(): void {
    this.groupInvitationsSubject.complete();
  }

  onFetch(sort: string[]): void {
    if (JSON.stringify(sort) !== JSON.stringify(this.currentSort)) {
      this.currentSort = sort;
      this.groupInvitationsSubject.next({ sort: this.currentSort });
    }
  }

  onCustomSort(event: SortEvent): void {
    const sortMeta = event.multiSortMeta?.map(meta => (meta.order === -1 ? `-${meta.field}` : meta.field));
    if (sortMeta) this.onFetch(sortMeta);
  }

  onAccept(pendingRequest: PendingRequest): void {
    this.processing = true;
    this.processGroupInvitationService.accept(pendingRequest.group.id).subscribe({
      next: result => {
        this.processing = false;
        if (!result.changed) {
          this.actionFeedbackService.error(`The ${ pendingRequest.group.name } group has not been accepted`);
          return;
        }
        this.actionFeedbackService.success(`The ${ pendingRequest.group.name } group has been accepted`);
        this.groupInvitationsSubject.next({ sort: this.currentSort });
        this.currentContentService.forceNavMenuReload();
      },
      error: err => {
        this.processing = false;
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      },
    });
  }

  onReject(pendingRequest: PendingRequest): void {
    this.processing = true;
    this.processGroupInvitationService.reject(pendingRequest.group.id).subscribe({
      next: result => {
        this.processing = false;
        if (!result.changed) {
          this.actionFeedbackService.success(`The ${ pendingRequest.group.name } group has been declined`);
          return;
        }
        this.actionFeedbackService.success(`The ${ pendingRequest.group.name } group has been declined`);
        this.groupInvitationsSubject.next({ sort: this.currentSort });
        this.currentContentService.forceNavMenuReload();
      },
      error: err => {
        this.processing = false;
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      },
    });
  }
}
