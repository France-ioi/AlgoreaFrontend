import { Component, forwardRef, inject } from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormErrorComponent } from 'src/app/ui-components/form-error/form-error.component';
import { InputNumberComponent } from 'src/app/ui-components/input-number/input-number.component';
import { SelectComponent } from 'src/app/ui-components/select/select.component';
import { SelectOptionComponent } from 'src/app/ui-components/select/select-option/select-option.component';
import { SelectOption } from 'src/app/ui-components/select/select-option/selected-option.service';
import { SwitchComponent } from 'src/app/ui-components/switch/switch.component';
import { ItemEntryMinAdmittedMembersRatio, ItemParametersTeamValue } from 'src/app/items/models/item-parameters';

@Component({
  selector: 'alg-item-parameters-team',
  templateUrl: './item-parameters-team.component.html',
  styleUrl: './item-parameters-team.component.scss',
  imports: [
    ReactiveFormsModule,
    FormErrorComponent,
    InputNumberComponent,
    SelectComponent,
    SelectOptionComponent,
    SwitchComponent,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ItemParametersTeamComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ItemParametersTeamComponent),
      multi: true,
    },
  ],
})
export class ItemParametersTeamComponent implements ControlValueAccessor {
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    entryParticipantTypeIsTeam: [ false ],
    entryFrozenTeams: [ false ],
    entryMaxTeamSize: [ 0 ],
    entryMinAdmittedMembersRatio: this.fb.nonNullable.control<ItemEntryMinAdmittedMembersRatio>('None'),
  });

  readonly minAdmittedMembersRatioOptions: SelectOption[] = [
    { label: $localize`All the members must be admitted`, value: 'All' },
    { label: $localize`Half of the members must be admitted`, value: 'Half' },
    { label: $localize`One of the members must be admitted`, value: 'One' },
    { label: $localize`None of the members has to be admitted`, value: 'None' },
  ];

  // Synchronous propagation, same pattern as `ItemStringsControlComponent`: an effect-based push
  // would defer `markAsDirty` to the post-CD effect-flush phase, causing NG0100 on the wrapper.
  // Kept as a field (not a void expression) so eslint's no-unused-expressions doesn't flag it;
  // teardown is wired via `takeUntilDestroyed()`.
  private valueChangesSub = this.form.valueChanges
    .pipe(takeUntilDestroyed())
    .subscribe(() => this.onChange(this.form.getRawValue()));

  // `refreshMaxTeamSizeValidators` only depends on `entryParticipantTypeIsTeam`; watching just
  // that control avoids dozens of needless `setValidators` calls when other fields change.
  private participantTypeSub = this.form.controls.entryParticipantTypeIsTeam.valueChanges
    .pipe(takeUntilDestroyed())
    .subscribe(() => this.refreshMaxTeamSizeValidators());

  writeValue(value: ItemParametersTeamValue | null): void {
    if (!value) return;
    this.form.patchValue(value, { emitEvent: false });
    this.refreshMaxTeamSizeValidators();
  }

  validate(): ValidationErrors | null {
    return this.form.invalid ? { teamForm: true } : null;
  }

  private onChange: (value: ItemParametersTeamValue | null) => void = () => {};

  registerOnChange(fn: (value: ItemParametersTeamValue | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: () => void): void {}

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) this.form.disable({ emitEvent: false });
    else this.form.enable({ emitEvent: false });
  }

  private refreshMaxTeamSizeValidators(): void {
    const enable = this.form.controls.entryParticipantTypeIsTeam.value;
    this.form.controls.entryMaxTeamSize.setValidators(enable ? Validators.min(1) : null);
    this.form.controls.entryMaxTeamSize.updateValueAndValidity({ emitEvent: false });
  }
}
