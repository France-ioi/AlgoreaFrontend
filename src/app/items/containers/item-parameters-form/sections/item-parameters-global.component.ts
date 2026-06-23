import { Component, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from 'src/app/ui-components/input/input.component';
import { SwitchComponent } from 'src/app/ui-components/switch/switch.component';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';

export type ItemParametersGlobalForm = FormGroup<{
  url: FormControl<string>,
  usesApi: FormControl<boolean>,
  textId: FormControl<string>,
}>;

// `alg-input` / `alg-input-error` still type their parent as `UntypedFormGroup`, but a typed
// `FormGroup<…>` is structurally assignable so we can pass our typed form straight through.
@Component({
  selector: 'alg-item-parameters-global',
  templateUrl: './item-parameters-global.component.html',
  styleUrl: './item-parameters-global.component.scss',
  imports: [
    ReactiveFormsModule,
    InputComponent,
    SwitchComponent,
    TooltipDirective,
  ],
})
export class ItemParametersGlobalComponent {
  form = input.required<ItemParametersGlobalForm>();

  /** Server-side text_id uniqueness error, surfaced by the parent CVA via `setErrors`. */
  textIdError = input<string | null>(null);
}
