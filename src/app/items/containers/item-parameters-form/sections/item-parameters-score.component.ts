import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SelectComponent } from 'src/app/ui-components/select/select.component';
import { SelectOptionComponent } from 'src/app/ui-components/select/select-option/select-option.component';
import { SelectOption } from 'src/app/ui-components/select/select-option/selected-option.service';
import { SwitchComponent } from 'src/app/ui-components/switch/switch.component';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';
import { ItemValidationType } from 'src/app/items/models/item-parameters';

export type ItemParametersScoreForm = FormGroup<{
  validationType: FormControl<ItemValidationType>,
  noScore: FormControl<boolean>,
}>;

@Component({
  selector: 'alg-item-parameters-score',
  templateUrl: './item-parameters-score.component.html',
  styleUrls: [ './item-parameters-score.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    SelectComponent,
    SelectOptionComponent,
    SwitchComponent,
    TooltipDirective,
  ],
})
export class ItemParametersScoreComponent {
  form = input.required<ItemParametersScoreForm>();

  readonly validationCriteriaOptions: SelectOption[] = [
    { label: $localize`Never`, value: 'None' },
    { label: $localize`All children validated`, value: 'All' },
    { label: $localize`All children but one validated`, value: 'AllButOne' },
    { label: $localize`All 'Categories' children validated`, value: 'Categories' },
    { label: $localize`One children validated`, value: 'One' },
  ];
}
