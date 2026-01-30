import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, inject } from '@angular/core';
import { Group } from '../../models/group';
import { distinctUntilChanged, switchMap, map, filter } from 'rxjs/operators';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { GetGroupChildrenService, GroupChild } from '../../data-access/get-group-children.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { GroupDeleteService } from '../../data-access/group-delete.service';
import { Router } from '@angular/router';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { AsyncPipe } from '@angular/common';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { ConfirmationModalService } from 'src/app/services/confirmation-modal.service';

@Component({
  selector: 'alg-group-remove-button',
  templateUrl: './group-remove-button.component.html',
  styleUrls: [ './group-remove-button.component.scss' ],
  imports: [ LoadingComponent, ErrorComponent, AsyncPipe, ButtonComponent ]
})
export class GroupRemoveButtonComponent implements OnChanges, OnDestroy {
  private actionFeedbackService = inject(ActionFeedbackService);
  private confirmationModalService = inject(ConfirmationModalService);
  private getGroupChildrenService = inject(GetGroupChildrenService);
  private groupDeleteService = inject(GroupDeleteService);
  private router = inject(Router);

  @Input() group?: Group;

  @Output() groupDeleted = new EventEmitter<void>();

  deletionInProgress$ = new Subject<boolean>();

  private readonly id$ = new ReplaySubject<string>(1);
  private refresh$ = new Subject<void>();
  readonly state$ = this.id$.pipe(
    distinctUntilChanged(),
    switchMap(id => this.hasGroupChildren$(id)),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  ngOnChanges(): void {
    if (this.group) {
      this.id$.next(this.group.id);
    }
  }

  ngOnDestroy(): void {
    this.id$.complete();
    this.refresh$.complete();
  }

  hasGroupChildren$(groupId: string): Observable<boolean> {
    return this.getGroupChildrenService.getGroupChildren(groupId).pipe(
      map((groupChild: GroupChild[]) => groupChild.length > 0)
    );
  }

  onDeleteGroup(): void {
    if (!this.group) throw new Error('Unexpected: Missed group');
    const id = this.group.id;
    const groupName = this.group.name;

    this.deletionInProgress$.next(true);
    this.confirmationModalService.open({
      title: $localize`Confirm Action`,
      message: $localize`Are you sure you want to delete the group "${ groupName }"`,
      messageIconStyleClass: 'ph-duotone ph-warning-circle alg-validation-error',
      acceptButtonCaption: $localize`Delete it`,
      acceptButtonIcon: 'ph-bold ph-check',
      acceptButtonStyleClass: 'danger',
      rejectButtonIcon: 'ph-bold ph-x',
    }).pipe(
      filter(accepted => !!accepted),
      switchMap(() => this.groupDeleteService.delete(id))
    ).subscribe({
      next: () => {
        this.actionFeedbackService.success($localize`You have deleted "${groupName}"`);
        this.groupDeleted.emit();
        void this.router.navigate([ '/groups/mine' ]);
      },
      error: _err => {
        this.actionFeedbackService.error($localize`Failed to delete "${groupName}"`);
      },
      complete: () => this.deletionInProgress$.next(false),
    });
  }

  refresh(): void {
    this.refresh$.next();
  }

}
