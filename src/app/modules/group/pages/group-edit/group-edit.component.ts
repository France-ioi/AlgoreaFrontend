import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ERROR_MESSAGE } from 'src/app/shared/constants/api';
import { TOAST_LENGTH } from 'src/app/shared/constants/global';
import { PendingChangesComponent } from 'src/app/shared/guards/pending-changes-guard';
import { Ready, Fetching, FetchError, isReady } from 'src/app/shared/helpers/state';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { Group } from '../../http-services/get-group-by-id.service';
import { GroupChanges, GroupUpdateService } from '../../http-services/group-update.service';
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
  })
  initialFormData?: Group;

  state$ = this.groupDataSource.state$;

  subscription?: Subscription;

  constructor(
    private currentContent: CurrentContentService,
    private groupDataSource: GroupDataSource,
    private messageService: MessageService,
    private formBuilder: FormBuilder,
    private groupUpdateService: GroupUpdateService
  ) {
    this.currentContent.editState.next('editing');

    this.subscription = this.state$
      .pipe(filter<Ready<Group> | Fetching | FetchError, Ready<Group>>(isReady))
      .subscribe(state => {
        this.initialFormData = state.data;
        this.resetFormWith(state.data);
      });
  }

  ngOnDestroy(): void {
    this.currentContent.editState.next('non-editable');
    this.subscription?.unsubscribe();
  }

  isDirty(): boolean {
    return this.groupForm.dirty;
  }

  successToast(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Changes successfully saved.',
      life: TOAST_LENGTH,
    });
  }

  errorToast(message?: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message || ERROR_MESSAGE.fail,
      life: TOAST_LENGTH,
    });
  }

  getGroupChanges(): GroupChanges {
    const description = this.groupForm.get('description')?.value as string;
    return {
      name: this.groupForm.get('name')?.value as string,
      description: description === '' ? null : description,
    };
  }

  save(): void {
    if (!this.initialFormData) return;

    if (this.groupForm.invalid) {
      this.errorToast('You need to solve all the errors displayed in the form to save changes.');
      return;
    }

    this.groupForm.disable();
    this.groupUpdateService.updateGroup(
      this.initialFormData.id,
      this.getGroupChanges(),
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
    this.groupForm.reset({
      name: group.name,
      description: group.description,
    });
    this.groupForm.enable();
  }
}
