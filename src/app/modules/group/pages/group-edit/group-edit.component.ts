import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { readyData } from 'src/app/shared/operators/state';
import { Mode, ModeService } from 'src/app/shared/services/mode.service';
import { forkJoin, of, Subscription } from 'rxjs';
import { concatMap, filter } from 'rxjs/operators';
import { CreateItemService } from 'src/app/modules/item/http-services/create-item.service';
import { ERROR_MESSAGE } from 'src/app/shared/constants/api';
import { TOAST_LENGTH } from 'src/app/shared/constants/global';
import { PendingChangesComponent } from 'src/app/shared/guards/pending-changes-guard';
import { NoActivity, NewActivity, ExistingActivity,
  isNewActivity, isExistingActivity } from '../../components/associated-activity/associated-activity-types';
import { Group } from '../../http-services/get-group-by-id.service';
import { GroupUpdateService } from '../../http-services/group-update.service';
import { GroupDataSource } from '../../services/group-datasource.service';

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

  state$ = this.groupDataSource.state$;

  subscription?: Subscription;

  constructor(
    private modeService: ModeService,
    private groupDataSource: GroupDataSource,
    private messageService: MessageService,
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

  successToast(): void {
    this.messageService.add({
      severity: 'success',
      summary: $localize`Success`,
      detail: $localize`Changes successfully saved.`,
      life: TOAST_LENGTH,
    });
  }

  errorToast(message?: string): void {
    this.messageService.add({
      severity: 'error',
      summary: $localize`Error`,
      detail: message || ERROR_MESSAGE.fail,
      life: TOAST_LENGTH,
    });
  }

  save(): void {
    if (!this.initialFormData) return;

    if (this.groupForm.invalid) {
      this.errorToast($localize`You need to solve all the errors displayed in the form to save changes.`);
      return;
    }
    this.groupForm.disable();

    const rootActivity = this.groupForm.get('rootActivity')?.value as NoActivity|NewActivity|ExistingActivity;
    const description = this.groupForm.get('description')?.value as string;

    forkJoin({
      id: of(this.initialFormData.id),
      changes: forkJoin({
        name: of(this.groupForm.get('name')?.value as string),
        description: of(description === '' ? null : description),
        root_activity_id: !isNewActivity(rootActivity) ? of(isExistingActivity(rootActivity) ? rootActivity.id : null) :
          this.createItemService.create({
            title: rootActivity.name,
            type: rootActivity.itemType,
            languageTag: 'en',
            asRootOfGroupId: this.initialFormData.id,
          }),
      })
    }).pipe(
      concatMap(group => this.groupUpdateService.updateGroup(
        group.id,
        group.changes
      ))
    ).subscribe(
      () => {
        this.groupDataSource.refetchGroup(); // will re-enable the form
        this.successToast();
      },
      _err => {
        this.groupForm.enable();
        this.errorToast();
      }
    );
  }

  resetForm(): void {
    if (this.initialFormData) this.resetFormWith(this.initialFormData);
  }

  private resetFormWith(group: Group): void {

    const rootActivity = group.root_activity_id === null ?
      { type: 'no-activity' } :
      { type: 'existing-activity', id: group.root_activity_id };

    this.groupForm.reset({
      name: group.name,
      description: group.description,
      rootActivity: rootActivity,
    });
    this.groupForm.enable();
  }
}
