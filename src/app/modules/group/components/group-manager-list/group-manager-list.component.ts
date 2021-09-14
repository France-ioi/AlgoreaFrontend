import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { GetGroupManagersService, Manager } from '../../http-services/get-group-managers.service';
import { GroupData } from '../../services/group-datasource.service';
import { RemoveGroupManagerService } from '../../http-services/remove-group-manager.service';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'alg-group-manager-list',
  templateUrl: './group-manager-list.component.html',
  styleUrls: [ './group-manager-list.component.scss' ]
})
export class GroupManagerListComponent implements OnChanges {

  @Input() groupData?: GroupData;

  managers: (Manager & { canManageAsText: string })[] = [];

  state: 'loading' | 'ready' | 'error' = 'loading';

  selection: Manager[] = [];
  removalInProgress = false;

  constructor(
    private getGroupManagersService: GetGroupManagersService,
    private removeGroupManagerService: RemoveGroupManagerService,
    private actionFeedbackService: ActionFeedbackService,
    private feedbackService: ActionFeedbackService,
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {
    this.reloadData();
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
    if (!this.groupData) return;
    this.state = 'loading';
    this.getGroupManagersService
      .getGroupManagers(this.groupData.group.id)
      .subscribe({
        next: (managers: Manager[]) => {
          this.managers = managers.map(manager => ({
            ...manager,
            canManageAsText: this.getManagerLevel(manager),
          }));
          this.state = 'ready';
        },
        error: _err => {
          this.state = 'error';
        }
      });
  }

  onSelectAll(): void {
    if (this.selection.length === this.managers.length) {
      this.selection = [];
      return;
    }
    this.selection = this.managers;
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
        this.feedbackService.success($localize`User(s) have been removed`);
        this.selection = [];
        this.reloadData();
      },
      error: () => {
        this.removalInProgress = false;
        this.actionFeedbackService.unexpectedError();
      }
    });
  }
}
