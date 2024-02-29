import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { Group } from '../../data-access/get-group-by-id.service';
import { distinctUntilChanged, switchMap, map } from 'rxjs/operators';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { GetGroupChildrenService, GroupChild } from '../../data-access/get-group-children.service';
import { ConfirmationService } from 'primeng/api';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { GroupDeleteService } from '../../data-access/group-delete.service';
import { Router } from '@angular/router';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { ButtonModule } from 'primeng/button';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { NgIf, AsyncPipe } from '@angular/common';

@Component({
  selector: 'alg-group-remove-button',
  templateUrl: './group-remove-button.component.html',
  styleUrls: [ './group-remove-button.component.scss' ],
  standalone: true,
  imports: [ NgIf, LoadingComponent, ButtonModule, ErrorComponent, AsyncPipe ]
})
export class GroupRemoveButtonComponent implements OnChanges, OnDestroy {
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

  constructor(
    private actionFeedbackService: ActionFeedbackService,
    private confirmationService: ConfirmationService,
    private getGroupChildrenService: GetGroupChildrenService,
    private groupDeleteService: GroupDeleteService,
    private router: Router,
  ) { }

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
    if (!this.group) {
      return;
    }

    this.confirmationService.confirm({
      message: $localize`Are you sure you want to delete the group "${ this.group.name }"`,
      header: $localize`Confirm Action`,
      icon: 'ph-duotone ph-warning-circle',
      acceptLabel: $localize`Delete it`,
      acceptIcon: 'ph-bold ph-check',
      accept: () => {
        this.deleteGroup();
      },
      rejectLabel: $localize`No`,
      rejectIcon: 'ph-bold ph-x',
    });
  }

  deleteGroup(): void {
    if (!this.group) {
      return;
    }

    const id = this.group.id;
    const groupName = this.group.name;

    this.deletionInProgress$.next(true);
    this.groupDeleteService.delete(id)
      .subscribe({
        next: () => {
          this.deletionInProgress$.next(false);
          this.actionFeedbackService.success($localize`You have deleted "${groupName}"`);
          this.groupDeleted.emit();
          this.navigateToMyGroups();
        },
        error: _err => {
          this.deletionInProgress$.next(false);
          this.actionFeedbackService.error($localize`Failed to delete "${groupName}"`);
        }
      });
  }

  navigateToMyGroups(): void {
    void this.router.navigate([ '/groups/mine' ]);
  }

  refresh(): void {
    this.refresh$.next();
  }

}
