import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { mapStateData, readyData } from 'src/app/shared/operators/state';
import { Mode, ModeService } from 'src/app/shared/services/mode.service';
import { Observable, of, Subscription } from 'rxjs';
import { concatMap, filter, switchMap, map } from 'rxjs/operators';
import { CreateItemService } from 'src/app/modules/item/http-services/create-item.service';
import { PendingChangesComponent } from 'src/app/shared/guards/pending-changes-guard';
import { NoActivity, NewActivity, ExistingActivity,
  isNewActivity, isExistingActivity } from '../../components/associated-activity/associated-activity-types';
import { Group } from '../../http-services/get-group-by-id.service';
import { GroupUpdateService } from '../../http-services/group-update.service';
import { GroupDataSource } from '../../services/group-datasource.service';
import { withManagementAdditions } from '../../helpers/group-management';
import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';
import { GroupDeleteService } from '../../services/group-delete.service';
import { ConfirmationService } from 'primeng/api';
import { GetGroupChildrenService } from '../../http-services/get-group-children.service';
import { isNotNullOrUndefined } from '../../../../shared/helpers/is-not-null-or-undefined';

@Component({
  selector: 'alg-group-edit',
  templateUrl: './group-edit.component.html',
  styleUrls: [ './group-edit.component.scss' ]
})
export class GroupEditComponent implements OnDestroy, PendingChangesComponent {
  groupForm = this.formBuilder.group({
    // eslint-disable-next-line @typescript-eslint/unbound-method
    name: [ '', [ Validators.required, Validators.minLength(3) ] ],
    description: [ '', [] ],
    rootActivity: [ '', [] ],
  })
  initialFormData?: Group;

  state$ = this.groupDataSource.state$.pipe(mapStateData(g => withManagementAdditions(g)))
  hasChildren$?: Observable<boolean>;

  subscription?: Subscription;

  constructor(
    private modeService: ModeService,
    private groupDataSource: GroupDataSource,
    private actionFeedbackService: ActionFeedbackService,
    private formBuilder: FormBuilder,
    private groupUpdateService: GroupUpdateService,
    private createItemService: CreateItemService,
    private groupDeleteService: GroupDeleteService,
    private confirmationService: ConfirmationService,
    private getGroupChildrenService: GetGroupChildrenService
  ) {
    this.modeService.mode$.next(Mode.Editing);

    this.subscription = this.state$
      .pipe(readyData())
      .subscribe(item => {
        this.initialFormData = item;
        this.resetFormWith(item);
      });

    this.hasChildren$ = this.state$.pipe(
      filter(isNotNullOrUndefined),
      map(state => state.data),
      filter(isNotNullOrUndefined),
      switchMap(data =>
        this.getGroupChildrenService.getGroupChildren(data.id).pipe(
          map(response => response.length > 0)
        )
      )
    );
  }

  ngOnDestroy(): void {
    this.modeService.mode$.next(Mode.Normal);
    this.subscription?.unsubscribe();
  }

  isDirty(): boolean {
    return this.groupForm.dirty;
  }

  save(): void {
    if (!this.initialFormData) return;

    if (this.groupForm.invalid) {
      this.actionFeedbackService.error($localize`You need to solve all the errors displayed in the form to save changes.`);
      return;
    }
    this.groupForm.disable();

    const id = this.initialFormData.id;
    const name = this.groupForm.get('name')?.value as string;
    const description = this.groupForm.get('description')?.value as string;

    const rootActivity = this.groupForm.get('rootActivity')?.value as NoActivity|NewActivity|ExistingActivity;
    const rootActivityId = !isNewActivity(rootActivity) ? of(isExistingActivity(rootActivity) ? rootActivity.id : null) :
      this.createItemService.create({
        title: rootActivity.name,
        type: rootActivity.activityType,
        languageTag: 'en',// FIXME
        asRootOfGroupId: this.initialFormData.id,
      });

    rootActivityId.pipe(
      concatMap(rootActivityId => this.groupUpdateService.updateGroup(id, {
        name,
        description: description === '' ? null : description,
        root_activity_id: rootActivityId
      }))
    ).subscribe(
      () => {
        this.groupDataSource.refetchGroup(); // will re-enable the form
        this.actionFeedbackService.success($localize`Changes successfully saved.`);
      },
      _err => {
        this.groupForm.enable();
        this.actionFeedbackService.unexpectedError();
      }
    );
  }

  resetForm(): void {
    if (this.initialFormData) this.resetFormWith(this.initialFormData);
  }

  private resetFormWith(group: Group): void {

    const rootActivity = group.rootActivityId === null ?
      { tag: 'no-activity' } :
      { tag: 'existing-activity', id: group.rootActivityId };

    this.groupForm.reset({
      name: group.name,
      description: group.description,
      rootActivity: rootActivity,
    });
    this.groupForm.enable();
  }

  onDeleteGroup(group: Group): void {
    this.confirmationService.confirm({
      message: $localize`Are you sure you want to delete the group "${ group.name }"`,
      header: $localize`Confirm Action`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: $localize`Delete it`,
      accept: () => {
        this.deleteGroup(group);
      },
      rejectLabel: $localize`No`,
    });
  }

  deleteGroup(group: Group): void {
    const id = group.id;
    this.groupDeleteService.delete(id).subscribe();
  }
}
