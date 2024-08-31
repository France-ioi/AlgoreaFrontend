import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { ItemData } from '../../models/item-data';
import {
  AbstractControl,
  UntypedFormBuilder,
  ValidationErrors,
  ValidatorFn,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { ItemChanges, UpdateItemService } from '../../data-access/update-item.service';
import { ItemStringChanges, UpdateItemStringService } from '../../data-access/update-item-string.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { Item } from 'src/app/data-access/get-item-by-id.service';
import { isNotUndefined } from 'src/app/utils/null-undefined-predicates';
import { Duration } from 'src/app/utils/duration';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { PendingChangesComponent } from 'src/app/guards/pending-changes-guard';
import { PendingChangesService } from 'src/app/services/pending-changes-service';
import { AllowsEditingAllItemPipe, AllowsEditingChildrenItemPipe } from 'src/app/items/models/item-edit-permission';
import { FloatingSaveComponent } from 'src/app/ui-components/floating-save/floating-save.component';
import { ItemEditAdvancedParametersComponent } from '../item-edit-advanced-parameters/item-edit-advanced-parameters.component';
import { ItemEditContentComponent } from '../item-edit-content/item-edit-content.component';
import { InputComponent } from 'src/app/ui-components/input/input.component';
import { NgIf } from '@angular/common';
import { fromItemContent } from '../../store';
import { Store } from '@ngrx/store';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';

export const DEFAULT_ENTERING_TIME_MIN = '1000-01-01T00:00:00Z';
export const DEFAULT_ENTERING_TIME_MAX = '9999-12-31T23:59:59Z';

interface ServerValidationError extends HttpErrorResponse {
  error: {
    errors: ValidationErrors,
  },
}

function isServerValidationErrors(e: HttpErrorResponse): e is ServerValidationError {
  const errorBody: unknown = e.error;
  return errorBody !== null && typeof errorBody === 'object'
    && 'errors' in errorBody && errorBody.errors !== null && typeof errorBody.errors === 'object';
}

@Component({
  selector: 'alg-item-edit-wrapper',
  templateUrl: './item-edit-wrapper.component.html',
  styleUrls: [ './item-edit-wrapper.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    InputComponent,
    ItemEditContentComponent,
    ItemEditAdvancedParametersComponent,
    FloatingSaveComponent,
    AllowsEditingAllItemPipe,
    AllowsEditingChildrenItemPipe,
    ErrorComponent,
  ],
})
export class ItemEditWrapperComponent implements OnInit, OnChanges, OnDestroy, PendingChangesComponent {
  @Input() itemData?: ItemData;

  itemForm = this.formBuilder.group({
    // eslint-disable-next-line @typescript-eslint/unbound-method
    title: [ '', [ Validators.required, Validators.minLength(3), Validators.maxLength(200) ] ],
    subtitle: [ '', Validators.maxLength(200) ],
    description: [ '' ],
    image_url: [ '', Validators.maxLength(2000) ],
    url: [ '', Validators.maxLength(2000) ],
    text_id: [ '', Validators.maxLength(200) ],
    uses_api: [ false ],
    validation_type: [ '' ],
    no_score: [ false ],
    title_bar_visible: [ false ],
    prompt_to_join_group_by_code: [ false ],
    full_screen: [ '' ],
    children_layout: [ '' ],
    allows_multiple_attempts: [ false ],
    requires_explicit_entry: [ false ],
    duration_enabled: [ false ],
    duration: [ null ],
    entering_time_min_enabled: [ false ],
    entering_time_min: [ null ],
    entering_time_max_enabled: [ false ],
    entering_time_max: [ null ],
    entry_participant_type: [ false ],
    entry_frozen_teams: [ false ],
    entry_max_team_size: [ '' ],
    entry_min_admitted_members_ratio: [ '' ],
  }, {
    validators: [ this.maxTeamSizeValidator() ],
  });
  initialFormData?: Item & {durationEnabled?: boolean, enteringTimeMinEnabled?: boolean, enteringTimeMaxEnabled?: boolean};

  get enableParticipation(): boolean {
    return this.initialFormData?.type !== 'Skill';
  }

  get enableTeam(): boolean {
    return this.initialFormData?.type !== 'Skill';
  }

  constructor(
    private store: Store,
    private currentContentService: CurrentContentService,
    private formBuilder: UntypedFormBuilder,
    private updateItemService: UpdateItemService,
    private updateItemStringService: UpdateItemStringService,
    private actionFeedbackService: ActionFeedbackService,
    private pendingChangesService: PendingChangesService,
  ) {}

  ngOnInit(): void {
    this.pendingChangesService.set(this);
  }

  ngOnChanges(): void {
    if (this.itemData) {
      this.initialFormData = {
        ...this.itemData.item,
        durationEnabled: this.itemData.item.duration !== null,
        enteringTimeMinEnabled: this.itemData.item.enteringTimeMin.getTime() !== new Date(DEFAULT_ENTERING_TIME_MIN).getTime(),
        enteringTimeMaxEnabled: this.itemData.item.enteringTimeMax.getTime() !== new Date(DEFAULT_ENTERING_TIME_MAX).getTime(),
      };
      this.resetForm();
    }
  }

  ngOnDestroy(): void {
    this.pendingChangesService.clear();
  }

  isDirty(): boolean {
    return this.itemForm.dirty;
  }

  private getItemChanges(): ItemChanges | undefined {
    const formControls: {[key: string]: AbstractControl | null} = {
      url: this.itemForm.get('url'),
      textId: this.itemForm.get('text_id'),
      usesApi: this.itemForm.get('uses_api'),
      validationType: this.itemForm.get('validation_type'),
      noScore: this.itemForm.get('no_score'),
      titleBarVisible: this.itemForm.get('title_bar_visible'),
      promptToJoinGroupByCode: this.itemForm.get('prompt_to_join_group_by_code'),
      fullScreen: this.itemForm.get('full_screen'),
      childrenLayout: this.itemForm.get('children_layout'),
      ...(this.enableParticipation ? {
        allowsMultipleAttempts: this.itemForm.get('allows_multiple_attempts'),
        requiresExplicitEntry: this.itemForm.get('requires_explicit_entry'),
        durationEnabled: this.itemForm.get('duration_enabled'),
        duration: this.itemForm.get('duration'),
        enteringTimeMinEnabled: this.itemForm.get('entering_time_min_enabled'),
        enteringTimeMin: this.itemForm.get('entering_time_min'),
        enteringTimeMaxEnabled: this.itemForm.get('entering_time_max_enabled'),
        enteringTimeMax: this.itemForm.get('entering_time_max'),
      } : {}),
      ...(this.enableTeam ? {
        entryParticipantType: this.itemForm.get('entry_participant_type'),
        entryFrozenTeams: this.itemForm.get('entry_frozen_teams'),
        entryMaxTeamSize: this.itemForm.get('entry_max_team_size'),
        entryMinAdmittedMembersRatio: this.itemForm.get('entry_min_admitted_members_ratio'),
      } : {}),
    };

    if (Object.values(formControls).includes(null) || !this.initialFormData) return undefined;

    const itemFormValues: ItemChanges = {};

    const url = formControls.url?.value !== '' ? formControls.url?.value as string : null;
    if (isNotUndefined(this.initialFormData.url) && url !== this.initialFormData.url) itemFormValues.url = url;

    const usesApi = formControls.usesApi?.value as boolean;
    if (isNotUndefined(this.initialFormData.usesApi) && usesApi !== this.initialFormData.usesApi) itemFormValues.uses_api = usesApi;

    const textIdValue = ((formControls.textId?.value as string | null) || '').trim();
    const textId = textIdValue !== '' ? textIdValue : null;
    if (textId !== this.initialFormData.textId) itemFormValues.text_id = textId;

    const validationType = formControls.validationType?.value as 'None' | 'All' | 'AllButOne' | 'Categories' | 'One' | 'Manual';
    if (validationType !== this.initialFormData.validationType) itemFormValues.validation_type = validationType;

    const noScore = formControls.noScore?.value as boolean;
    if (noScore !== this.initialFormData.noScore) itemFormValues.no_score = noScore;

    const titleBarVisible = formControls.titleBarVisible?.value as boolean;
    if (titleBarVisible !== this.initialFormData.titleBarVisible) itemFormValues.title_bar_visible = titleBarVisible;

    const promptToJoinGroupByCode = formControls.promptToJoinGroupByCode?.value as boolean;
    if (promptToJoinGroupByCode !== this.initialFormData.promptToJoinGroupByCode)
      itemFormValues.prompt_to_join_group_by_code = promptToJoinGroupByCode;

    const fullScreen = formControls.fullScreen?.value as 'forceYes' | 'forceNo' | 'default';
    if (fullScreen !== this.initialFormData.fullScreen) itemFormValues.full_screen = fullScreen;

    const childrenLayout = formControls.childrenLayout?.value as 'List' | 'Grid';
    if (childrenLayout !== this.initialFormData.childrenLayout) itemFormValues.children_layout = childrenLayout;

    if (this.enableParticipation) {
      const allowsMultipleAttempts = formControls.allowsMultipleAttempts?.value as boolean;
      if (allowsMultipleAttempts !== this.initialFormData.allowsMultipleAttempts) {
        itemFormValues.allows_multiple_attempts = allowsMultipleAttempts;
      }

      const requiresExplicitEntry = formControls.requiresExplicitEntry?.value as boolean;
      const hasRequiresExplicitEntryChanges = requiresExplicitEntry !== this.initialFormData.requiresExplicitEntry;

      if (hasRequiresExplicitEntryChanges) {
        itemFormValues.requires_explicit_entry = requiresExplicitEntry;
      }

      const durationEnabled = formControls.durationEnabled?.value as boolean;
      const duration = formControls.duration?.value as Duration | null;
      const hasDurationEnabledChanges = durationEnabled !== this.initialFormData.durationEnabled;
      const hasDurationChanges = duration?.getMs() !== this.initialFormData?.duration?.getMs();

      if (hasDurationChanges || hasDurationEnabledChanges || hasRequiresExplicitEntryChanges) {
        itemFormValues.duration = durationEnabled && requiresExplicitEntry ? duration?.toString() : null;
      }

      const enteringTimeMinEnabled = formControls.enteringTimeMinEnabled?.value as boolean;
      const hasEnteringTimeMinEnabledChanges = enteringTimeMinEnabled !== this.initialFormData.enteringTimeMinEnabled;
      const enteringTimeMin = formControls.enteringTimeMin?.value as Date;
      const hasEnteringTimeMinChanges = enteringTimeMin.getTime()
        !== this.initialFormData.enteringTimeMin.getTime();

      if (hasEnteringTimeMinChanges || hasEnteringTimeMinEnabledChanges) {
        itemFormValues.entering_time_min = enteringTimeMinEnabled ? enteringTimeMin : new Date(DEFAULT_ENTERING_TIME_MIN);
      }

      const enteringTimeMaxEnabled = formControls.enteringTimeMaxEnabled?.value as boolean;
      const hasEnteringTimeMaxEnabledChanges = enteringTimeMaxEnabled !== this.initialFormData.enteringTimeMaxEnabled;
      const enteringTimeMax = formControls.enteringTimeMax?.value as Date;
      const hasEnteringTimeMaxChanges = enteringTimeMax.getTime()
        !== this.initialFormData.enteringTimeMax.getTime();

      if (hasEnteringTimeMaxChanges || hasEnteringTimeMaxEnabledChanges) {
        itemFormValues.entering_time_max = enteringTimeMaxEnabled ? enteringTimeMax : new Date(DEFAULT_ENTERING_TIME_MAX);
      }
    }

    if (this.enableTeam) {
      const entryParticipantType = (formControls.entryParticipantType?.value as boolean | undefined) ? 'Team' : 'User';
      const hasEntryParticipantTypeChanges = entryParticipantType !== this.initialFormData.entryParticipantType;
      if (hasEntryParticipantTypeChanges) {
        itemFormValues.entry_participant_type = entryParticipantType;
      }

      const entryFrozenTeams = formControls.entryFrozenTeams?.value as boolean | undefined;
      const hasEntryFrozenTeamsChanges = entryFrozenTeams !== this.initialFormData.entryFrozenTeams;
      if (hasEntryFrozenTeamsChanges) {
        itemFormValues.entry_frozen_teams = entryFrozenTeams;
      }

      const entryMaxTeamSize = formControls.entryMaxTeamSize?.value as number | undefined;
      const hasEntryMaxTeamSizeChanges = entryMaxTeamSize !== this.initialFormData.entryMaxTeamSize;
      if (hasEntryMaxTeamSizeChanges) {
        itemFormValues.entry_max_team_size = entryMaxTeamSize;
      }

      const entryMinAdmittedMembersRatio = formControls.entryMinAdmittedMembersRatio?.value as 'None' | 'All' | 'One' | 'Half' | undefined;
      const hasEntryMinAdmittedMembersRatioChanges = entryMinAdmittedMembersRatio !== this.initialFormData.entryMinAdmittedMembersRatio;
      if (hasEntryMinAdmittedMembersRatioChanges) {
        itemFormValues.entry_min_admitted_members_ratio = entryMinAdmittedMembersRatio;
      }
    }

    return itemFormValues;
  }

  private updateItem(): Observable<void> {
    if (!this.initialFormData) return throwError(() => new Error('Invalid initial data'));
    const changes = this.getItemChanges();
    if (!changes) return throwError(() => new Error('Invalid form'));
    if (!Object.keys(changes).length) return of(undefined);
    return this.updateItemService.updateItem(this.initialFormData.id, changes);
  }

  // Item string changes
  private getItemStringChanges(): ItemStringChanges | undefined {
    const titleControl = this.itemForm.get('title');
    const subtitleControl = this.itemForm.get('subtitle');
    const descriptionControl = this.itemForm.get('description');
    const imageUrlControl = this.itemForm.get('image_url');
    const initialValues = this.initialFormData?.string;

    if (titleControl === null || subtitleControl === null || descriptionControl === null || imageUrlControl === null
      || !initialValues) return undefined;

    const res: ItemStringChanges = {};

    const title = titleControl.value as string;
    if (title !== initialValues.title) res.title = title.trim();

    const subtitle = (subtitleControl.value as string).trim() || null;
    if (subtitle !== initialValues.subtitle) res.subtitle = subtitle;

    const description = (descriptionControl.value as string).trim() || null;
    if (description !== initialValues.description) res.description = description;

    const imageUrl = (imageUrlControl.value as string).trim() || null;
    if (imageUrl !== initialValues.imageUrl) res.image_url = imageUrl;

    return res;
  }

  private updateString(): Observable<void> {
    if (!this.initialFormData) return throwError(() => new Error('Missing ID form'));
    const itemStringChanges = this.getItemStringChanges();
    if (!itemStringChanges) return throwError(() => new Error('Invalid form or initial data'));
    if (!Object.keys(itemStringChanges).length) return of(undefined);
    return this.updateItemStringService.updateItem(this.initialFormData.id, itemStringChanges);
  }

  save(): void {
    if (!this.initialFormData) return;

    if (this.itemForm.invalid) {
      this.actionFeedbackService.error($localize`You need to solve all the errors displayed in the form to save changes.`);
      return;
    }

    this.itemForm.disable();
    forkJoin([
      this.updateItem(),
      this.updateString(),
    ]).subscribe({
      next: _status => {
        this.actionFeedbackService.success($localize`Changes successfully saved.`);
        this.store.dispatch(fromItemContent.itemByIdPageActions.refresh()); // which will re-enable the form
        this.currentContentService.forceNavMenuReload();
      },
      error: (err: unknown) => {
        this.itemForm.enable();
        if (err instanceof HttpErrorResponse && isServerValidationErrors(err)) {
          this.itemForm.setErrors(err.error.errors);
          return;
        }
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      }
    });
  }

  onCancel(): void {
    this.resetForm();
  }

  onConfirmRemoval(): void {
    this.resetForm();
  }

  private resetForm(): void {
    if (!this.initialFormData) {
      return;
    }

    const item = this.initialFormData;

    this.itemForm.reset({
      title: item.string.title || '',
      description: item.string.description || '',
      image_url: item.string.imageUrl || '',
      subtitle: item.string.subtitle || '',
      url: item.url || '',
      text_id: item.textId,
      uses_api: item.usesApi || false,
      validation_type: item.validationType,
      no_score: item.noScore,
      title_bar_visible: item.titleBarVisible || false,
      prompt_to_join_group_by_code: item.promptToJoinGroupByCode || false,
      full_screen: item.fullScreen,
      children_layout: item.childrenLayout,
      ...(this.enableParticipation ? {
        allows_multiple_attempts: item.allowsMultipleAttempts,
        requires_explicit_entry: item.requiresExplicitEntry,
        duration_enabled: item.durationEnabled,
        duration: item.duration,
        entering_time_min_enabled: item.enteringTimeMinEnabled,
        entering_time_min: item.enteringTimeMin,
        entering_time_max_enabled: item.enteringTimeMaxEnabled,
        entering_time_max: item.enteringTimeMax,
      } : {}),
      ...(this.enableTeam ? {
        entry_participant_type: item.entryParticipantType === 'Team',
        entry_frozen_teams: item.entryFrozenTeams,
        entry_max_team_size: item.entryMaxTeamSize,
        entry_min_admitted_members_ratio: item.entryMinAdmittedMembersRatio,
      } : {}),
    });
    this.itemForm.enable();
  }

  private maxTeamSizeValidator(): ValidatorFn {
    return (itemForm): null => {
      const isParticipationAsTeamOnly = itemForm.get('entry_participant_type')?.value as boolean;
      const maxTeamSizeControl = itemForm.get('entry_max_team_size');
      if (!maxTeamSizeControl) return null;

      isParticipationAsTeamOnly
        ? maxTeamSizeControl.setErrors(Validators.min(1)(maxTeamSizeControl))
        : maxTeamSizeControl.setErrors(null);
      return null;
    };
  }
}
