import { Component, OnDestroy, ViewChild } from '@angular/core';
import { ItemDataSource } from '../../services/item-datasource.service';
import { AbstractControl, FormBuilder, ValidatorFn, Validators } from '@angular/forms';
import { forkJoin, Observable, of, Subscription, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ItemStringChanges, UpdateItemStringService } from '../../http-services/update-item-string.service';
import { ItemChanges, UpdateItemService } from '../../http-services/update-item.service';
import { ChildData, ChildDataWithId, hasId } from '../../components/item-children-edit/item-children-edit.component';
import { Item } from '../../http-services/get-item-by-id.service';
import { ItemEditContentComponent } from '../item-edit-content/item-edit-content.component';
import { PendingChangesComponent } from 'src/app/shared/guards/pending-changes-guard';
import { CreateItemService, NewItem } from '../../http-services/create-item.service';
import { Mode, ModeService } from 'src/app/shared/services/mode.service';
import { readyData } from 'src/app/shared/operators/state';
import { Duration } from '../../../../shared/helpers/duration';
import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';
import { isNotUndefined } from 'src/app/shared/helpers/null-undefined-predicates';

const DEFAULT_ENTERING_TIME_MAX = '9999-12-31T23:59:59Z';

@Component({
  selector: 'alg-item-edit',
  templateUrl: './item-edit.component.html',
  styleUrls: [ './item-edit.component.scss' ],
})
export class ItemEditComponent implements OnDestroy, PendingChangesComponent {
  itemForm = this.formBuilder.group({
    // eslint-disable-next-line @typescript-eslint/unbound-method
    title: [ '', [ Validators.required, Validators.minLength(3), Validators.maxLength(200) ] ],
    subtitle: [ '', Validators.maxLength(200) ],
    description: [ '' ],
    url: [ '', Validators.maxLength(200) ],
    text_id: [ '', Validators.maxLength(200) ],
    uses_api: [ false ],
    validation_type: [ '' ],
    no_score: [ false ],
    title_bar_visible: [ false ],
    prompt_to_join_group_by_code: [ false ],
    full_screen: [ '' ],
    allows_multiple_attempts: [ false ],
    requires_explicit_entry: [ false ],
    duration_enabled: [ false ],
    duration: [ null ],
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
  itemChanges: { children?: ChildData[] } = {};

  fetchState$ = this.itemDataSource.state$;
  initialFormData?: Item & {durationEnabled?: boolean, enteringTimeMaxEnabled?: boolean};

  subscription?: Subscription;

  get enableParticipation(): boolean {
    return this.initialFormData?.type !== 'Skill';
  }

  get enableTeam(): boolean {
    return this.initialFormData?.type !== 'Skill';
  }

  @ViewChild('content') private editContent?: ItemEditContentComponent;

  constructor(
    private modeService: ModeService,
    private itemDataSource: ItemDataSource,
    private formBuilder: FormBuilder,
    private createItemService: CreateItemService,
    private updateItemService: UpdateItemService,
    private updateItemStringService: UpdateItemStringService,
    private actionFeedbackService: ActionFeedbackService,
  ) {
    this.modeService.mode$.next(Mode.Editing);
    this.subscription = this.fetchState$
      .pipe(readyData(), map(data => ({
        ...data.item,
        durationEnabled: data.item.duration !== null,
        enteringTimeMaxEnabled: data.item.enteringTimeMax.getTime() !== new Date(DEFAULT_ENTERING_TIME_MAX).getTime()
      })))
      .subscribe(data => {
        this.initialFormData = data;
        this.resetForm();
      });
  }

  ngOnDestroy(): void {
    this.modeService.mode$.next(Mode.Normal);
    this.subscription?.unsubscribe();
  }

  isDirty(): boolean {
    return this.itemForm.dirty;
  }

  updateItemChanges(children: ChildData[]): void {
    this.itemForm.markAsDirty();
    this.itemChanges.children = children;
  }

  // Update Item
  private createChildren(): Observable<ChildDataWithId[] | undefined>{
    if (!this.itemChanges.children) return of(undefined);
    return forkJoin(
      this.itemChanges.children.map(child => {
        if (!this.initialFormData) return throwError(new Error('Invalid form'));
        if (hasId(child)) return of(child);

        // the child doesnt have an id so we create it
        if (!child.title) return throwError(new Error('Something went wrong, the new child is missing his title'));
        if (!child.type) return throwError(new Error('Something went wrong, the new child is missing his type'));
        const newChild: NewItem = {
          title: child.title,
          type: child.type,
          languageTag: 'en',
          parent: this.initialFormData.id
        };
        return this.createItemService
          .create(newChild)
          .pipe(map(res => ({ id: res, ...child })));
      })
    );
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
      ...(this.enableParticipation ? {
        allowsMultipleAttempts: this.itemForm.get('allows_multiple_attempts'),
        requiresExplicitEntry: this.itemForm.get('requires_explicit_entry'),
        durationEnabled: this.itemForm.get('duration_enabled'),
        duration: this.itemForm.get('duration'),
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

    const textId = formControls.textId?.value as string;
    if (textId !== '') itemFormValues.text_id = textId;

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

      const enteringTimeMin = formControls.enteringTimeMin?.value as Date;
      const hasEnteringTimeMinChanges = enteringTimeMin.getTime()
        !== this.initialFormData.enteringTimeMin.getTime();

      if (hasEnteringTimeMinChanges) {
        itemFormValues.entering_time_min = enteringTimeMin;
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
    return this.createChildren().pipe(
      switchMap(res => {
        if (!this.initialFormData) return throwError(new Error('Invalid initial data'));
        const changes = this.getItemChanges();
        if (!changes) return throwError(new Error('Invalid form'));
        if (res) {
          // @TODO: Avoid affecting component vars in Observable Operator
          // save the new children (their ids) to prevent recreating them in case of error
          this.itemChanges.children = res;
          changes.children = res.map((child, idx) => ({
            item_id: child.id,
            order: idx,
            score_weight: child.scoreWeight,
            content_view_propagation: child.contentViewPropagation,
            edit_propagation: child.editPropagation,
            grant_view_propagation: child.grantViewPropagation,
            upper_view_levels_propagation: child.upperViewLevelsPropagation,
            watch_propagation: child.watchPropagation,
          }));
        }
        if (!Object.keys(changes).length) return of(undefined);
        return this.updateItemService.updateItem(this.initialFormData.id, changes);
      }),
    );
  }

  // Item string changes
  private getItemStringChanges(): ItemStringChanges | undefined {
    const titleControl = this.itemForm.get('title');
    const subtitleControl = this.itemForm.get('subtitle');
    const descriptionControl = this.itemForm.get('description');
    const initialValues = this.initialFormData?.string;

    if (titleControl === null || subtitleControl === null || descriptionControl === null || !initialValues) return undefined;

    const res: ItemStringChanges = {};

    const title = titleControl.value as string;
    if (title !== initialValues.title) res.title = title.trim();

    const subtitle = (subtitleControl.value as string).trim() || null;
    if (subtitle !== initialValues.subtitle) res.subtitle = subtitle;

    const description = (descriptionControl.value as string).trim() || null;
    if (description !== initialValues.description) res.description = description;

    return res;
  }

  private updateString(): Observable<void> {
    if (!this.initialFormData) return throwError(new Error('Missing ID form'));
    const itemStringChanges = this.getItemStringChanges();
    if (!itemStringChanges) return throwError(new Error('Invalid form or initial data'));
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
        this.itemDataSource.refreshItem(); // which will re-enable the form
      },
      error: _err => {
        this.actionFeedbackService.unexpectedError();
        this.itemForm.enable();
      }
    });
  }

  onCancel(): void {
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
      subtitle: item.string.subtitle || '',
      url: item.url || '',
      text_id: '',
      uses_api: item.usesApi || false,
      validation_type: item.validationType,
      no_score: item.noScore,
      title_bar_visible: item.titleBarVisible || false,
      prompt_to_join_group_by_code: item.promptToJoinGroupByCode || false,
      full_screen: item.fullScreen,
      ...(this.enableParticipation ? {
        allows_multiple_attempts: item.allowsMultipleAttempts,
        requires_explicit_entry: item.requiresExplicitEntry,
        duration_enabled: item.durationEnabled,
        duration: item.duration,
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
    this.itemChanges = {};
    this.itemForm.enable();
    this.editContent?.reset();
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
