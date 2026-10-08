import { Component, computed, forwardRef, inject, input, signal } from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder,
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Duration, HOURS } from 'src/app/utils/duration';
import { DurationComponent } from 'src/app/ui-components/duration/duration.component';
import { InputDateComponent } from 'src/app/ui-components/input-date/input-date.component';
import { SwitchComponent } from 'src/app/ui-components/switch/switch.component';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';
import { TimeZoneNamePipe } from 'src/app/pipes/timeZoneName';
import {
  DEFAULT_ENTERING_TIME_MAX,
  DEFAULT_ENTERING_TIME_MIN,
  ItemParametersParticipationValue,
} from 'src/app/items/models/item-parameters';
import { ItemType } from 'src/app/items/models/item-type';
import { MessageInfoComponent } from 'src/app/ui-components/message-info/message-info.component';

interface ExplicitEntryAdvice {
  kind: 'warning' | 'info',
  text: string,
  icon: string,
}

@Component({
  selector: 'alg-item-parameters-participation',
  templateUrl: './item-parameters-participation.component.html',
  styleUrl: './item-parameters-participation.component.scss',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TimeZoneNamePipe,
    SwitchComponent,
    DurationComponent,
    InputDateComponent,
    TooltipDirective,
    MessageInfoComponent,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ItemParametersParticipationComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ItemParametersParticipationComponent),
      multi: true,
    },
  ],
})
export class ItemParametersParticipationComponent implements ControlValueAccessor {
  private fb = inject(FormBuilder);

  itemType = input.required<ItemType>();
  savedRequiresExplicitEntry = input.required<boolean>();
  savedAllowsMultipleAttempts = input.required<boolean>();

  // eslint-disable-next-line max-len
  private readonly notRecommendedTaskText = $localize`It is not recommended to convert a regular task to manual participation as some users may already have attempts of that task and so these users may be unable to enter manually. Prefer creating directly a task with manual participation.`;
  // eslint-disable-next-line max-len
  private readonly notRecommendedChapterText = $localize`It is not recommended to convert a regular chapter to manual participation as some users may already have attempts of that chapter and so these users may be unable to enter manually. Prefer creating directly a chapter with manual participation.`;
  // eslint-disable-next-line max-len
  private readonly allowMultipleTaskText = $localize`It is recommended to allow multiple attempts when converting to a regular task so that users who already participated previously can try new submissions on that task.`;
  // eslint-disable-next-line max-len
  private readonly allowMultipleChapterText = $localize`It is recommended to allow multiple attempts when converting to a regular chapter so that users who already participated previously can try new submissions on that chapter.`;

  form = this.fb.nonNullable.group({
    allowsMultipleAttempts: [ false ],
    requiresExplicitEntry: [ false ],
    durationEnabled: [ false ],
    duration: this.fb.control<Duration | null>(null),
    enteringTimeMinEnabled: [ false ],
    enteringTimeMin: this.fb.control<Date | null>(null),
    enteringTimeMaxEnabled: [ false ],
    enteringTimeMax: this.fb.control<Date | null>(null),
  });

  private readonly enteringTimeMin = signal<Date | null>(null);
  private readonly enteringTimeMax = signal<Date | null>(null);
  private readonly enteringTimeMinEnabled = signal(false);
  readonly requiresExplicitEntry = signal(false);

  readonly switched = computed(() => this.requiresExplicitEntry() !== this.savedRequiresExplicitEntry());

  readonly explicitEntryAdvice = computed((): ExplicitEntryAdvice | null => {
    const isTask = this.itemType() === 'Task';
    if (!this.savedRequiresExplicitEntry()) {
      return {
        kind: 'warning',
        text: isTask ? this.notRecommendedTaskText : this.notRecommendedChapterText,
        icon: 'ph-duotone ph-warning-circle',
      };
    }
    if (!this.savedAllowsMultipleAttempts()) {
      return {
        kind: 'info',
        text: isTask ? this.allowMultipleTaskText : this.allowMultipleChapterText,
        icon: 'ph-duotone ph-info',
      };
    }
    return null;
  });

  readonly minEnteringTimeMaxDate = computed(() => {
    const minEnabled = this.enteringTimeMinEnabled();
    const min = this.enteringTimeMin();
    const max = this.enteringTimeMax();
    return minEnabled && min && max ? new Date(Math.min(min.getTime(), max.getTime())) : new Date();
  });

  // Synchronous propagation, same pattern as `ItemStringsControlComponent`: an effect-based push
  // would defer `markAsDirty` to the post-CD effect-flush phase, causing NG0100 on the wrapper.
  // Kept as a field (not a void expression) so eslint's no-unused-expressions doesn't flag it;
  // teardown is wired via `takeUntilDestroyed()`.
  private valueChangesSub = this.form.valueChanges
    .pipe(takeUntilDestroyed())
    .subscribe(() => {
      this.refreshDurationValidators();
      this.requiresExplicitEntry.set(this.form.controls.requiresExplicitEntry.value);
      this.enteringTimeMin.set(this.form.controls.enteringTimeMin.value);
      this.enteringTimeMax.set(this.form.controls.enteringTimeMax.value);
      this.enteringTimeMinEnabled.set(this.form.controls.enteringTimeMinEnabled.value);
      this.onChange(this.form.getRawValue());
    });

  writeValue(value: ItemParametersParticipationValue | null): void {
    if (!value) return;
    this.form.patchValue(value, { emitEvent: false });
    this.refreshDurationValidators();
    this.requiresExplicitEntry.set(value.requiresExplicitEntry);
    this.enteringTimeMin.set(value.enteringTimeMin);
    this.enteringTimeMax.set(value.enteringTimeMax);
    this.enteringTimeMinEnabled.set(value.enteringTimeMinEnabled);
  }

  validate(): ValidationErrors | null {
    return this.form.invalid ? { participationForm: true } : null;
  }

  private onChange: (value: ItemParametersParticipationValue | null) => void = () => {};

  registerOnChange(fn: (value: ItemParametersParticipationValue | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: () => void): void {}

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) this.form.disable({ emitEvent: false });
    else this.form.enable({ emitEvent: false });
  }

  onEnteringTimeMinEnabledChange(enabled: boolean): void {
    if (!enabled) return;
    const enteringTimeMin = this.form.controls.enteringTimeMin.value;
    // Replace the "no constraint" sentinel with today so the date picker shows a usable value.
    if (enteringTimeMin && enteringTimeMin.getTime() === new Date(DEFAULT_ENTERING_TIME_MIN).getTime()) {
      this.form.controls.enteringTimeMin.patchValue(new Date());
    }
  }

  onEnteringTimeMaxEnabledChange(enabled: boolean): void {
    if (!enabled) return;
    const enteringTimeMax = this.form.controls.enteringTimeMax.value;
    if (enteringTimeMax && enteringTimeMax.getTime() === new Date(DEFAULT_ENTERING_TIME_MAX).getTime()) {
      const minEnabled = this.form.controls.enteringTimeMinEnabled.value;
      const enteringTimeMin = minEnabled ? this.form.controls.enteringTimeMin.value : new Date();
      const newTimeMax = enteringTimeMin && (minEnabled ? enteringTimeMin.getTime() + HOURS : enteringTimeMin.getTime());
      if (newTimeMax) {
        this.form.controls.enteringTimeMax.patchValue(new Date(newTimeMax));
      }
    }
  }

  private refreshDurationValidators(): void {
    const enable = this.form.controls.requiresExplicitEntry.value && this.form.controls.durationEnabled.value;
    this.form.controls.duration.setValidators(enable ? Validators.required : null);
    this.form.controls.duration.updateValueAndValidity({ emitEvent: false });
  }
}
