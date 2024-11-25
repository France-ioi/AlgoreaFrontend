import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { mapStateData, readyData } from 'src/app/utils/operators/state';
import { of, Subscription, combineLatest, take, takeWhile, BehaviorSubject, switchMap } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { CreateItemService } from 'src/app/data-access/create-item.service';
import { PendingChangesComponent } from 'src/app/guards/pending-changes-guard';
import { NoAssociatedItem, NewAssociatedItem, ExistingAssociatedItem,
  isNewAssociatedItem, isExistingAssociatedItem } from '../associated-item/associated-item-types';
import { Group } from '../../data-access/get-group-by-id.service';
import { GroupChanges, GroupUpdateService } from '../../data-access/group-update.service';
import { ManagementAdditions, withManagementAdditions } from '../../models/group-management';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { PendingChangesService } from 'src/app/services/pending-changes-service';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { FloatingSaveComponent } from 'src/app/ui-components/floating-save/floating-save.component';
import { GroupRemoveButtonComponent } from '../group-remove-button/group-remove-button.component';
import { AssociatedItemComponent } from '../associated-item/associated-item.component';
import { TextareaComponent } from 'src/app/ui-components/textarea/textarea.component';
import { InputComponent } from 'src/app/ui-components/input/input.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { NgIf, AsyncPipe } from '@angular/common';
import { SwitchComponent } from 'src/app/ui-components/switch/switch.component';
import { SelectionComponent } from 'src/app/ui-components/selection/selection.component';
import { MessageInfoComponent } from 'src/app/ui-components/message-info/message-info.component';
import { InputMaskModule } from 'primeng/inputmask';
import { InputDateComponent } from 'src/app/ui-components/input-date/input-date.component';
import { GroupApprovals } from 'src/app/groups/models/group-approvals';
import { DialogModule } from 'primeng/dialog';
import { GetGroupMembersService } from '../../data-access/get-group-members.service';
import { ButtonModule } from 'primeng/button';
import { Store } from '@ngrx/store';
import { fromGroupContent } from '../../store';

@Component({
  selector: 'alg-group-edit',
  templateUrl: './group-edit.component.html',
  styleUrls: [ './group-edit.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    LoadingComponent,
    ErrorComponent,
    FormsModule,
    ReactiveFormsModule,
    InputComponent,
    TextareaComponent,
    AssociatedItemComponent,
    GroupRemoveButtonComponent,
    FloatingSaveComponent,
    AsyncPipe,
    SwitchComponent,
    SelectionComponent,
    MessageInfoComponent,
    InputMaskModule,
    InputDateComponent,
    DialogModule,
    ButtonModule,
  ],
})
export class GroupEditComponent implements OnInit, OnDestroy, PendingChangesComponent {
  approvalOptions: { label: string, value: string }[] = [
    {
      label: $localize`No`,
      value: 'none',
    },
    {
      label: $localize`Read only`,
      value: 'view',
    },
    {
      label: $localize`Read and edit`,
      value: 'edit',
    },
  ];

  groupForm = this.formBuilder.group({
    // eslint-disable-next-line @typescript-eslint/unbound-method
    name: [ '', [ Validators.required, Validators.minLength(3) ] ],
    description: [ '', [] ],
    requireLockMembershipApprovalUntilEnabled: [ false, [] ],
    requireLockMembershipApprovalUntil: [ null, [] ],
    requirePersonalInfoAccessApproval: [ 'none', [] ],
    rootActivity: [ '', [] ],
    rootSkill: [ '', [] ],
  });
  initialFormData?: Group;
  minLockMembershipApprovalUntilDate?: Date;
  showConfirmApprovalDialog = new BehaviorSubject<{
    opened: boolean,
    data?: GroupChanges['approval_change_action'],
  }>({ opened: false });

  state$ = this.store.select(fromGroupContent.selectActiveContentGroup).pipe(
    mapStateData<Group, Group & ManagementAdditions, { id: string}>(withManagementAdditions),
  );

  subscription?: Subscription;

  constructor(
    private store: Store,
    private currentContentService: CurrentContentService,
    private actionFeedbackService: ActionFeedbackService,
    private formBuilder: UntypedFormBuilder,
    private groupUpdateService: GroupUpdateService,
    private createItemService: CreateItemService,
    private pendingChangesService: PendingChangesService,
    private getGroupMembersService: GetGroupMembersService,
  ) {
    this.subscription = this.state$
      .pipe(readyData())
      .subscribe(item => {
        this.initialFormData = item;
        this.resetFormWith(item);
        if (item.requireLockMembershipApprovalUntil !== null) {
          this.onRequireLockMembershipApprovalUntilEnabledChange(true);
        }
      });
  }

  ngOnInit(): void {
    this.pendingChangesService.set(this);
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.pendingChangesService.clear();
    this.showConfirmApprovalDialog.complete();
  }

  isDirty(): boolean {
    return this.groupForm.dirty;
  }

  onConfirmApprovalDialogCancel(): void {
    this.showConfirmApprovalDialog.next({ opened: false });
    this.groupForm.enable();
  }

  onConfirmApprovalDialogChange(event: GroupChanges['approval_change_action']): void {
    this.showConfirmApprovalDialog.next({ opened: false, data: event });
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
    const requireLockMembershipApprovalUntilEnabled = this.groupForm.get('requireLockMembershipApprovalUntilEnabled')?.value as boolean;
    const requireLockMembershipApprovalUntil
      = this.groupForm.get('requireLockMembershipApprovalUntil')?.value as GroupApprovals['requireLockMembershipApprovalUntil'];
    const requirePersonalInfoAccessApproval
      = this.groupForm.get('requirePersonalInfoAccessApproval')?.value as GroupApprovals['requirePersonalInfoAccessApproval'];

    const rootActivity = this.groupForm.get('rootActivity')?.value as NoAssociatedItem|NewAssociatedItem|ExistingAssociatedItem;
    const rootActivityId$ = !isNewAssociatedItem(rootActivity) ? of(isExistingAssociatedItem(rootActivity) ? rootActivity.id : null) :
      this.createItemService.create({
        title: rootActivity.name,
        url: rootActivity.url,
        type: rootActivity.itemType,
        languageTag: 'en',// FIXME
        asRootOfGroupId: this.initialFormData.id,
      });

    const rootSkill = this.groupForm.get('rootSkill')?.value as NoAssociatedItem|NewAssociatedItem|ExistingAssociatedItem;
    const rootSkillId$ = !isNewAssociatedItem(rootSkill) ? of(isExistingAssociatedItem(rootSkill) ? rootSkill.id : null) :
      this.createItemService.create({
        title: rootSkill.name,
        type: rootSkill.itemType,
        languageTag: 'en',// FIXME
        asRootOfGroupId: this.initialFormData.id,
      });

    const currentDate = new Date();
    const requireConfirmApproval = (
      requireLockMembershipApprovalUntilEnabled && (
        requireLockMembershipApprovalUntil !== null && requireLockMembershipApprovalUntil > currentDate &&
        (
          this.initialFormData.requireLockMembershipApprovalUntil !== null
          && currentDate > this.initialFormData.requireLockMembershipApprovalUntil
          || this.initialFormData.requireLockMembershipApprovalUntil === null
        )
      )
    ) || (
      requirePersonalInfoAccessApproval !== 'none' && this.initialFormData.requirePersonalInfoAccessApproval === 'none'
      || requirePersonalInfoAccessApproval === 'edit' && this.initialFormData.requirePersonalInfoAccessApproval !== 'edit'
    );

    const defaultParams$ = combineLatest([ rootActivityId$, rootSkillId$ ]).pipe(
      map(([ rootActivityId, rootSkillId ]) => (<GroupChanges>{
        name,
        description: description === '' ? null : description,
        root_activity_id: rootActivityId,
        root_skill_id: rootSkillId,
        require_lock_membership_approval_until: requireLockMembershipApprovalUntilEnabled ? requireLockMembershipApprovalUntil : null,
        require_personal_info_access_approval: requirePersonalInfoAccessApproval,
      })),
    );

    const confirmApprovalParams$ = this.getGroupMembersService.getGroupMembers(id).pipe(
      switchMap(members => {
        if (members.length === 0) return of(undefined);
        this.showConfirmApprovalDialog.next({ opened: true });
        return this.showConfirmApprovalDialog.pipe(
          takeWhile(dialog =>
            dialog.opened || !dialog.opened && dialog.data !== undefined
          ),
          filter(dialog => !dialog.opened && dialog.data !== undefined),
          map(dialog => ({ approval_change_action: dialog.data })),
          take(1),
        );
      }),
    );

    defaultParams$.pipe(
      switchMap(params => (requireConfirmApproval ? confirmApprovalParams$.pipe(
        map(confirmApprovalParams =>
          (confirmApprovalParams !== undefined ? { ...params, ...confirmApprovalParams } : params)
        )
      ) : of(params))),
      switchMap(params => this.groupUpdateService.updateGroup(id, params)),
    ).subscribe({
      next: () => {
        this.showConfirmApprovalDialog.next({ opened: false });
        this.store.dispatch(fromGroupContent.groupPageActions.refresh()); // will re-enable the form
        this.refreshNav();
        this.actionFeedbackService.success($localize`Changes successfully saved.`);
      },
      error: (err: any) => {
        this.showConfirmApprovalDialog.next({ opened: false });
        this.groupForm.enable();
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      },
    });
  }

  refreshNav(): void {
    this.currentContentService.forceNavMenuReload();
  }

  resetForm(): void {
    if (this.initialFormData) this.resetFormWith(this.initialFormData);
  }

  private resetFormWith(group: Group): void {
    const rootActivity = group.rootActivityId === null ?
      { tag: 'no-item' } :
      { tag: 'existing-item', id: group.rootActivityId };

    const rootSkill = group.rootSkillId === null ?
      { tag: 'no-item' } :
      { tag: 'existing-item', id: group.rootSkillId };

    this.groupForm.reset({
      name: group.name,
      description: group.description,
      requireLockMembershipApprovalUntilEnabled: group.requireLockMembershipApprovalUntil !== null,
      requireLockMembershipApprovalUntil: group.requireLockMembershipApprovalUntil,
      requirePersonalInfoAccessApproval: group.requirePersonalInfoAccessApproval,
      rootActivity,
      rootSkill,
    });
    this.groupForm.enable();
  }

  refreshGroup(): void {
    this.store.dispatch(fromGroupContent.groupPageActions.refresh());
  }

  onRequireLockMembershipApprovalUntilEnabledChange(enabled: boolean): void {
    const requireLockMembershipApprovalUntilControl = this.groupForm.get('requireLockMembershipApprovalUntil');
    if (!requireLockMembershipApprovalUntilControl) throw new Error('Unexpected: Missed requireLockMembershipApprovalUntil control');
    if (enabled) {
      const initialRequireLockMembershipApprovalUntil = this.initialFormData?.requireLockMembershipApprovalUntil;
      const currentDate = new Date();
      this.minLockMembershipApprovalUntilDate = initialRequireLockMembershipApprovalUntil && initialRequireLockMembershipApprovalUntil
        < currentDate ? initialRequireLockMembershipApprovalUntil : currentDate;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      requireLockMembershipApprovalUntilControl.addValidators(Validators.required);
    } else {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      requireLockMembershipApprovalUntilControl.removeValidators(Validators.required);
    }
    requireLockMembershipApprovalUntilControl.updateValueAndValidity();
  }
}
