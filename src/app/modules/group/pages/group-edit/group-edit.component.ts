import { Component, OnDestroy } from '@angular/core';
import { mapStateData, readyData } from 'src/app/shared/operators/state';
import { Mode, ModeService } from 'src/app/shared/services/mode.service';
import { of, Subscription } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { CreateItemService } from 'src/app/modules/item/http-services/create-item.service';
import { PendingChangesComponent } from 'src/app/shared/guards/pending-changes-guard';
import { NoActivity, NewActivity, ExistingActivity,
  isNewActivity, isExistingActivity } from '../../components/associated-activity/associated-activity-types';
import { Group } from '../../http-services/get-group-by-id.service';
import { GroupUpdateService } from '../../http-services/group-update.service';
import { GroupDataSource } from '../../services/group-datasource.service';
import { withManagementAdditions } from '../../helpers/group-management';
import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';
import { FormBuilder } from '@ngneat/reactive-forms';
import { Validators } from '@angular/forms';

interface GroupForm {
  name: string,
  description: string|null,
  rootActivity: NoActivity|NewActivity|ExistingActivity,
}

@Component({
  selector: 'alg-group-edit',
  templateUrl: './group-edit.component.html',
  styleUrls: [ './group-edit.component.scss' ]
})
export class GroupEditComponent implements OnDestroy, PendingChangesComponent {
  groupForm = this.formBuilder.group<GroupForm>({
    // eslint-disable-next-line @typescript-eslint/unbound-method
    name: [ '', [ Validators.required, Validators.minLength(3) ] ],
    description: [ '', [] ],
    rootActivity: [{ tag: 'no-activity' }, [] ],
  });
  initialFormData?: Group;

  state$ = this.groupDataSource.state$.pipe(mapStateData(g => withManagementAdditions(g)));

  subscription?: Subscription;

  constructor(
    private modeService: ModeService,
    private groupDataSource: GroupDataSource,
    private actionFeedbackService: ActionFeedbackService,
    private formBuilder: FormBuilder,
    private groupUpdateService: GroupUpdateService,
    private createItemService: CreateItemService,
  ) {
    this.modeService.mode$.next(Mode.Editing);

    this.subscription = this.state$
      .pipe(readyData())
      .subscribe(item => {
        this.initialFormData = item;
        this.resetFormWith(item);
      });
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
    const description = this.groupForm.value.description;

    const rootActivity = this.groupForm.value.rootActivity;
    const rootActivityId = !isNewActivity(rootActivity) ? of(isExistingActivity(rootActivity) ? rootActivity.id : null) :
      this.createItemService.create({
        title: rootActivity.name,
        type: rootActivity.activityType,
        languageTag: 'en',// FIXME
        asRootOfGroupId: this.initialFormData.id,
      });

    rootActivityId.pipe(
      concatMap(rootActivityId => this.groupUpdateService.updateGroup(id, {
        name: this.groupForm.value.name,
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

    const rootActivity: NoActivity|ExistingActivity = group.rootActivityId === null ?
      { tag: 'no-activity' } :
      { tag: 'existing-activity', id: group.rootActivityId };

    this.groupForm.reset({
      name: group.name,
      description: group.description,
      rootActivity: rootActivity,
    });
    this.groupForm.enable();
  }
}
