import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { mapStateData, readyData } from 'src/app/utils/operators/state';
import { of, Subscription, combineLatest } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { CreateItemService } from 'src/app/data-access/create-item.service';
import { PendingChangesComponent } from 'src/app/guards/pending-changes-guard';
import { NoAssociatedItem, NewAssociatedItem, ExistingAssociatedItem,
  isNewAssociatedItem, isExistingAssociatedItem } from '../associated-item/associated-item-types';
import { Group } from '../../data-access/get-group-by-id.service';
import { GroupUpdateService } from '../../data-access/group-update.service';
import { GroupDataSource } from '../../services/group-datasource.service';
import { withManagementAdditions } from '../../models/group-management';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { PendingChangesService } from 'src/app/services/pending-changes-service';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { FloatingSaveComponent } from 'src/app/ui-components/floating-save/floating-save.component';
import { GroupRemoveButtonComponent } from '../group-remove-button/group-remove-button.component';
import { AssociatedItemComponent } from '../associated-item/associated-item.component';
import { TextareaComponent } from 'src/app/ui-components/textarea/textarea.component';
import { InputComponent } from 'src/app/ui-components/input/input.component';
import { SectionComponent } from 'src/app/ui-components/section/section.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { NgIf, AsyncPipe } from '@angular/common';

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
    SectionComponent,
    InputComponent,
    TextareaComponent,
    AssociatedItemComponent,
    GroupRemoveButtonComponent,
    FloatingSaveComponent,
    AsyncPipe
  ],
})
export class GroupEditComponent implements OnInit, OnDestroy, PendingChangesComponent {
  groupForm = this.formBuilder.group({
    // eslint-disable-next-line @typescript-eslint/unbound-method
    name: [ '', [ Validators.required, Validators.minLength(3) ] ],
    description: [ '', [] ],
    rootActivity: [ '', [] ],
    rootSkill: [ '', [] ],
  });
  initialFormData?: Group;

  state$ = this.groupDataSource.state$.pipe(mapStateData(state => withManagementAdditions(state.group)));

  subscription?: Subscription;

  constructor(
    private currentContentService: CurrentContentService,
    private groupDataSource: GroupDataSource,
    private actionFeedbackService: ActionFeedbackService,
    private formBuilder: UntypedFormBuilder,
    private groupUpdateService: GroupUpdateService,
    private createItemService: CreateItemService,
    private pendingChangesService: PendingChangesService
  ) {
    this.subscription = this.state$
      .pipe(readyData())
      .subscribe(item => {
        this.initialFormData = item;
        this.resetFormWith(item);
      });
  }

  ngOnInit(): void {
    this.pendingChangesService.set(this);
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.pendingChangesService.clear();
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

    combineLatest([ rootActivityId$, rootSkillId$ ]).pipe(
      concatMap(([ rootActivityId, rootSkillId ]) => this.groupUpdateService.updateGroup(id, {
        name,
        description: description === '' ? null : description,
        root_activity_id: rootActivityId,
        root_skill_id: rootSkillId,
      }))
    ).subscribe({
      next: () => {
        this.groupDataSource.refetchGroup(); // will re-enable the form
        this.refreshNav();
        this.actionFeedbackService.success($localize`Changes successfully saved.`);
      },
      error: err => {
        this.groupForm.enable();
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      }
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
      rootActivity: rootActivity,
      rootSkill,
    });
    this.groupForm.enable();
  }

  refreshGroup(): void {
    this.groupDataSource.refetchGroup();
  }
}
