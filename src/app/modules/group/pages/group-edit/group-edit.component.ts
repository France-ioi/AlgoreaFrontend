import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ERROR_MESSAGE } from 'src/app/shared/constants/api';
import { TOAST_LENGTH } from 'src/app/shared/constants/global';
import { Ready, Fetching, FetchError, isReady } from 'src/app/shared/helpers/state';
import { CurrentContentService, EditAction } from 'src/app/shared/services/current-content.service';
import { Group } from '../../http-services/get-group-by-id.service';
import { GroupChanges, GroupUpdateService } from '../../http-services/group-update.service';
import { GroupDataSource } from '../../services/group-datasource.service';

@Component({
  selector: 'alg-group-edit',
  templateUrl: './group-edit.component.html',
  styleUrls: [ './group-edit.component.scss' ]
})
export class GroupEditComponent implements OnDestroy {
  groupId?: string;
  groupForm = this.formBuilder.group({
    // eslint-disable-next-line @typescript-eslint/unbound-method
    name: [ '', [ Validators.required, Validators.minLength(3) ] ],
  })

  state$ = this.groupDataSource.state$;

  subscriptions: Subscription[] = [];

  constructor(
    private currentContent: CurrentContentService,
    private groupDataSource: GroupDataSource,
    private messageService: MessageService,
    private formBuilder: FormBuilder,
    private groupUpdateService: GroupUpdateService
  ) {
    this.currentContent.editState.next('editing');

    this.subscriptions.push(
      this.state$.pipe(filter<Ready<Group> | Fetching | FetchError, Ready<Group>>(isReady))
      .subscribe(state => {
        this.groupId = state.data.id;
        this.groupForm.patchValue({ name: state.data.name });
      })
    );

    this.subscriptions.push(this.currentContent.editAction$
      .pipe(filter(action => action === EditAction.Save))
      .subscribe(_action => this.saveInput()));
  }

  ngOnDestroy(): void {
    this.currentContent.editState.next('non-editable');
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
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
    return {
      name: this.groupForm.get('name')?.value as string
    };
  }

  saveInput(): void {
    if (!this.groupId) return;

    if (this.groupForm.invalid) {
      this.errorToast('You need to solve all the errors displayed in the form to save changes.');
      return;
    }

    this.groupUpdateService.updateGroup(
      this.groupId,
      this.getGroupChanges(),
    ).subscribe(
      _status => {
        this.groupForm.disable();
        this.successToast();
        this.groupDataSource.refetchGroup();
        this.currentContent.editAction.next(EditAction.StopEditing);
      },
      _err => this.errorToast()
    );
  }
}
