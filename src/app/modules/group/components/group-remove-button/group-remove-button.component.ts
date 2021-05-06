import { Component, Input, OnInit } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';
import { catchError, map, tap } from 'rxjs/operators';
import { BehaviorSubject, merge, Observable, of } from 'rxjs';
import { GetGroupChildrenService, GroupChild } from '../../http-services/get-group-children.service';
import { ConfirmationService } from 'primeng/api';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';
import { GroupDeleteService } from '../../services/group-delete.service';
import { Router } from '@angular/router';

type GroupChildrenState = 'loading' | 'hasChildren' | 'empty' | 'error';

@Component({
  selector: 'alg-group-remove-button',
  templateUrl: './group-remove-button.component.html',
  styleUrls: [ './group-remove-button.component.scss' ]
})
export class GroupRemoveButtonComponent implements OnInit {
  @Input() group!: Group;

  loadingSubject$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  loading$: Observable<boolean> = this.loadingSubject$.asObservable();
  state$?: Observable<GroupChildrenState>;

  constructor(
    private actionFeedbackService: ActionFeedbackService,
    private confirmationService: ConfirmationService,
    private getGroupChildrenService: GetGroupChildrenService,
    private groupDeleteService: GroupDeleteService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.state$ = merge<GroupChildrenState>(
      of('loading'),
      this.getGroupChildrenService.getGroupChildren(this.group.id).pipe(
        map((groupChild: GroupChild[]) => (groupChild.length > 0 ? 'hasChildren' : 'empty')),
        catchError(() => of<GroupChildrenState>('error'))
      )
    );
  }

  onDeleteGroup(): void {
    this.confirmationService.confirm({
      message: $localize`Are you sure you want to delete the group "${ this.group.name }"`,
      header: $localize`Confirm Action`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: $localize`Delete it`,
      accept: () => {
        this.deleteGroup();
      },
      rejectLabel: $localize`No`,
    });
  }

  deleteGroup(): void {
    const id = this.group.id;
    const groupName = this.group.name;
    this.loadingSubject$.next(true);
    this.groupDeleteService.delete(id)
      .pipe(tap(() => this.loadingSubject$.next(false)))
      .subscribe(
        () => {
          this.actionFeedbackService.success($localize`You have delete "${groupName}"`);
          this.navigateToMyGroups();
        },
        _err => {
          this.actionFeedbackService.error($localize`Failed to delete "${groupName}"`);
        }
      );
  }

  navigateToMyGroups(): void {
    void this.router.navigate([ '/groups/mine' ]);
  }

}
