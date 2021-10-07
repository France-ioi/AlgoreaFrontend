import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { GetGroupManagersService, Manager } from '../../http-services/get-group-managers.service';
import { GroupData } from '../../services/group-datasource.service';
import { RemoveGroupManagerService } from '../../http-services/remove-group-manager.service';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';
import { forkJoin, ReplaySubject, Subject } from 'rxjs';
import { switchMap, map, distinctUntilChanged } from 'rxjs/operators';
import { mapToFetchState } from '../../../../shared/operators/state';

@Component({
  selector: 'alg-group-manager-list',
  templateUrl: './group-manager-list.component.html',
  styleUrls: [ './group-manager-list.component.scss' ]
})
export class GroupManagerListComponent implements OnChanges, OnDestroy {

  @Input() groupData?: GroupData;

  selection: Manager[] = [];
  removalInProgress = false;
  isPermissionsEditDialogOpened = false;
  dialogManager?: Manager & { canManageAsText: string };

  private refresh$ = new Subject<void>();
  private readonly groupId$ = new ReplaySubject<string>(1);
  readonly state$ = this.groupId$.pipe(
    distinctUntilChanged(),
    switchMap(id => this.getGroupManagersService.getGroupManagers(id).pipe(
      map(managers => managers.map(manager => ({
        ...manager,
        canManageAsText: this.getManagerLevel(manager),
      }))),
    )),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  constructor(
    private getGroupManagersService: GetGroupManagersService,
    private removeGroupManagerService: RemoveGroupManagerService,
    private actionFeedbackService: ActionFeedbackService,
    private feedbackService: ActionFeedbackService,
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.groupData) {
      this.groupId$.next(this.groupData.group.id);
    }
  }

  ngOnDestroy(): void {
    this.refresh$.complete();
  }

  private getManagerLevel(manager: Manager): string {
    switch (manager.canManage) {
      case 'none':
        return $localize`Read-only`;
      case 'memberships':
        return $localize`Memberships`;
      case 'memberships_and_group':
        return $localize`Memberships and group`;
    }
  }

  private reloadData(): void {
    this.refresh$.next();
  }

  onSelectAll(managers: Manager[]): void {
    if (this.selection.length === managers.length) {
      this.selection = [];
      return;
    }
    this.selection = managers;
  }

  onRemove(): void {
    if (this.selection.length === 0 || !this.groupData) {
      return;
    }

    const groupId = this.groupData.group.id;

    this.removalInProgress = true;

    forkJoin(
      this.selection.map(manager => this.removeGroupManagerService.remove(groupId, manager.id))
    ).subscribe({
      next: () => {
        this.removalInProgress = false;
        this.feedbackService.success($localize`Selected managers have been removed.`);
        this.selection = [];
        this.reloadData();
      },
      error: () => {
        this.removalInProgress = false;
        this.actionFeedbackService.unexpectedError();
      }
    });
  }

  openPermissionsEditDialog(manager: Manager & { canManageAsText: string }): void {
    this.isPermissionsEditDialogOpened = true;
    this.dialogManager = manager;
  }

  closePermissionsEditDialog(event: { updated: boolean }): void {
    this.isPermissionsEditDialogOpened = false;
    this.dialogManager = undefined;

    if (event.updated) {
      this.reloadData();
    }
  }
}
