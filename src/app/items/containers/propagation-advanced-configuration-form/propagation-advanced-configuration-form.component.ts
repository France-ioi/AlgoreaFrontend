import { Component, computed, input, output, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CollapsibleSectionComponent } from 'src/app/ui-components/collapsible-section/collapsible-section.component';
import { ProgressSelectComponent } from 'src/app/ui-components/collapsible-section/progress-select/progress-select.component';
import { generatePropagationsValuesWithValidation } from 'src/app/items/models/item-perm-propagation-values';
import { ItemCorePerm } from 'src/app/items/models/item-permissions';
import { SwitchFieldComponent } from 'src/app/ui-components/collapsible-section/switch-field/switch-field.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import {
  itemContentViewPermPropagationEnum,
  ItemPermPropagations,
  itemUpperViewLevelsPermPropagationEnum,
} from 'src/app/items/models/item-perm-propagation';
import { propagationsConstraintsValidator } from 'src/app/items/models/propagations-constraints-validator';

@Component({
  selector: 'alg-propagation-advanced-configuration-form',
  templateUrl: './propagation-advanced-configuration-form.component.html',
  styleUrl: './propagation-advanced-configuration-form.component.scss',
  imports: [
    ReactiveFormsModule,
    CollapsibleSectionComponent,
    ProgressSelectComponent,
    SwitchFieldComponent,
    ButtonComponent,
  ]
})
export class PropagationAdvancedConfigurationFormComponent {
  private fb = inject(FormBuilder);

  closeEvent = output<ItemPermPropagations | undefined>();
  giverPermissions = input.required<ItemCorePerm>();
  itemPropagations = input.required<Partial<ItemPermPropagations>>();

  data = computed(() =>
    generatePropagationsValuesWithValidation(this.giverPermissions(), this.itemPropagations())
  );

  form = this.fb.nonNullable.group({
    contentViewPropagation: this.fb.nonNullable.control<ItemPermPropagations['contentViewPropagation']>(
      itemContentViewPermPropagationEnum.none,
    ),
    upperViewLevelsPropagation: this.fb.nonNullable.control<ItemPermPropagations['upperViewLevelsPropagation']>(
      itemUpperViewLevelsPermPropagationEnum.use_content_view_propagation,
    ),
    grantViewPropagation: this.fb.nonNullable.control<ItemPermPropagations['grantViewPropagation']>(false),
    watchPropagation: this.fb.nonNullable.control<ItemPermPropagations['watchPropagation']>(false),
    editPropagation: this.fb.nonNullable.control<ItemPermPropagations['editPropagation']>(false),
  });

  constructor() {
    toObservable(computed(() => ({
      p: this.itemPropagations(),
      g: this.giverPermissions(),
    }))).pipe(takeUntilDestroyed()).subscribe(() => this.resetForm());
  }

  onSubmit(): void {
    if (!this.form.dirty || this.form.invalid) return;
    this.closeEvent.emit(this.form.getRawValue());
  }

  private resetForm(): void {
    const {
      contentViewPropagation,
      upperViewLevelsPropagation,
      grantViewPropagation,
      watchPropagation,
      editPropagation,
    } = this.itemPropagations();
    this.form.setValidators(propagationsConstraintsValidator(this.giverPermissions(), this.itemPropagations()));
    this.form.updateValueAndValidity();
    this.form.reset({
      ...(contentViewPropagation ? { contentViewPropagation } : {}),
      ...(upperViewLevelsPropagation ? { upperViewLevelsPropagation } : {}),
      ...(grantViewPropagation ? { grantViewPropagation } : {}),
      ...(watchPropagation ? { watchPropagation } : {}),
      ...(editPropagation ? { editPropagation } : {}),
    });
  }
}
