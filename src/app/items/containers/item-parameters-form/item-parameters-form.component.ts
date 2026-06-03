import { Component, computed, forwardRef, inject, input, output } from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder,
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Duration } from 'src/app/utils/duration';
import { ItemData } from 'src/app/items/models/item-data';
import {
  ItemChildrenLayout,
  ItemParametersDisplayValue,
  ItemParametersGlobalValue,
  ItemParametersParticipationValue,
  ItemParametersScoreValue,
  ItemParametersTeamValue,
  ItemParametersValue,
  ItemValidationType,
  sectionsForItemType,
} from 'src/app/items/models/item-parameters';
import { ItemRemoveButtonComponent } from 'src/app/items/containers/item-remove-button/item-remove-button.component';
import { ItemParametersGlobalComponent } from './sections/item-parameters-global.component';
import { ItemParametersScoreComponent } from './sections/item-parameters-score.component';
import { ItemParametersDisplayComponent } from './sections/item-parameters-display.component';
import { ItemParametersParticipationComponent } from './sections/item-parameters-participation.component';
import { ItemParametersTeamComponent } from './sections/item-parameters-team.component';
import { itemParametersValueEqual } from 'src/app/items/models/item-parameters-equality';
import { createCvaEcho } from 'src/app/utils/cva-echo';

@Component({
  selector: 'alg-item-parameters-form',
  templateUrl: './item-parameters-form.component.html',
  styleUrls: [ './item-parameters-form.component.scss' ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ItemParametersGlobalComponent,
    ItemParametersScoreComponent,
    ItemParametersDisplayComponent,
    ItemParametersParticipationComponent,
    ItemParametersTeamComponent,
    ItemRemoveButtonComponent,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ItemParametersFormComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ItemParametersFormComponent),
      multi: true,
    },
  ],
})
export class ItemParametersFormComponent implements ControlValueAccessor, Validator {
  private fb = inject(FormBuilder);

  itemData = input.required<ItemData>();
  /**
   * Server-side text_id error (e.g. "text_id must be unique"). The wrapper plucks it from the
   * outer itemForm errors on HTTP 4xx and threads it down to the Global section here.
   */
  textIdError = input<string | null>(null);
  confirmRemoval = output<void>();

  readonly sections = computed(() => sectionsForItemType(this.itemData().item.type));

  private outboundEcho = createCvaEcho(itemParametersValueEqual);

  /**
   * Inner form is structured by section so each sub-component (CVA or presentational) owns a
   * cohesive slice. We flatten / unflatten at the `writeValue` / `valueChanges` boundary so the
   * external API stays the flat `ItemParametersValue`.
   */
  form = this.fb.nonNullable.group({
    global: this.fb.nonNullable.group({
      url: [ '', Validators.maxLength(2000) ],
      usesApi: [ false ],
      textId: [ '', Validators.maxLength(200) ],
    }),
    score: this.fb.nonNullable.group({
      validationType: this.fb.nonNullable.control<ItemValidationType>('None'),
      noScore: [ false ],
    }),
    display: this.fb.nonNullable.group({
      promptToJoinGroupByCode: [ false ],
      childrenLayout: this.fb.nonNullable.control<ItemChildrenLayout>('List'),
      thumbnailUrl: [ '', Validators.maxLength(2000) ],
      disableChildrenPrevNextNav: [ false ],
      leftNavIcon: [ '' ],
    }),
    participation: this.fb.nonNullable.control<ItemParametersParticipationValue>({
      allowsMultipleAttempts: false,
      requiresExplicitEntry: false,
      durationEnabled: false,
      duration: null as Duration | null,
      enteringTimeMinEnabled: false,
      enteringTimeMin: null as Date | null,
      enteringTimeMaxEnabled: false,
      enteringTimeMax: null as Date | null,
    }),
    team: this.fb.nonNullable.control<ItemParametersTeamValue>({
      entryParticipantTypeIsTeam: false,
      entryFrozenTeams: false,
      entryMaxTeamSize: 0,
      entryMinAdmittedMembersRatio: 'None',
    }),
  });

  constructor() {
    // Synchronous propagation, same pattern as `ItemStringsControlComponent`: deferring through
    // an effect would mark the parent control dirty in the post-CD effect-flush phase and
    // trigger NG0100 on `@if (itemForm.dirty)` bindings up the tree.
    // Teardown is wired via `takeUntilDestroyed()`; the returned Subscription is intentionally
    // dropped to keep TS6138 (`unused private member`) and `no-unused-expressions` both happy.
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.outboundEcho.emitIfChanged(this.flatten(), v => this.onChange(v));
      });
  }

  writeValue(value: ItemParametersValue | null): void {
    if (!value) return;
    this.outboundEcho.rememberInbound(value);
    this.form.patchValue(this.unflatten(value), { emitEvent: false });
  }

  validate(): ValidationErrors | null {
    return this.form.invalid ? { itemParametersForm: true } : null;
  }

  private onChange: (value: ItemParametersValue | null) => void = () => {};

  registerOnChange(fn: (value: ItemParametersValue | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: () => void): void {}

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) this.form.disable({ emitEvent: false });
    else this.form.enable({ emitEvent: false });
  }

  private flatten(): ItemParametersValue {
    const v = this.form.getRawValue();
    return {
      ...v.global,
      ...v.score,
      ...v.display,
      ...v.participation,
      ...v.team,
    };
  }

  private unflatten(v: ItemParametersValue): {
    global: ItemParametersGlobalValue,
    score: ItemParametersScoreValue,
    display: ItemParametersDisplayValue,
    participation: ItemParametersParticipationValue,
    team: ItemParametersTeamValue,
  } {
    return {
      global: { url: v.url, usesApi: v.usesApi, textId: v.textId },
      score: { validationType: v.validationType, noScore: v.noScore },
      display: {
        promptToJoinGroupByCode: v.promptToJoinGroupByCode,
        childrenLayout: v.childrenLayout,
        thumbnailUrl: v.thumbnailUrl,
        disableChildrenPrevNextNav: v.disableChildrenPrevNextNav,
        leftNavIcon: v.leftNavIcon,
      },
      participation: {
        allowsMultipleAttempts: v.allowsMultipleAttempts,
        requiresExplicitEntry: v.requiresExplicitEntry,
        durationEnabled: v.durationEnabled,
        duration: v.duration,
        enteringTimeMinEnabled: v.enteringTimeMinEnabled,
        enteringTimeMin: v.enteringTimeMin,
        enteringTimeMaxEnabled: v.enteringTimeMaxEnabled,
        enteringTimeMax: v.enteringTimeMax,
      },
      team: {
        entryParticipantTypeIsTeam: v.entryParticipantTypeIsTeam,
        entryFrozenTeams: v.entryFrozenTeams,
        entryMaxTeamSize: v.entryMaxTeamSize,
        entryMinAdmittedMembersRatio: v.entryMinAdmittedMembersRatio,
      },
    };
  }
}
