import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, startWith, switchMap } from 'rxjs';
import { InputComponent } from 'src/app/ui-components/input/input.component';
import { SelectionComponent } from 'src/app/ui-components/selection/selection.component';
import { SwitchComponent } from 'src/app/ui-components/switch/switch.component';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';
import { ItemChildrenLayout } from 'src/app/items/models/item-parameters';

export type ItemParametersDisplayForm = FormGroup<{
  promptToJoinGroupByCode: FormControl<boolean>,
  childrenLayout: FormControl<ItemChildrenLayout>,
}>;

// `imageUrl` is rendered inside the Display section but lives server-side on the default-language
// item string, so the wrapper keeps owning it. We accept it via a separate FormGroup so `alg-input`
// (which needs an UntypedFormGroup) can bind to the `imageUrl` control directly.
@Component({
  selector: 'alg-item-parameters-display',
  templateUrl: './item-parameters-display.component.html',
  styleUrls: [ './item-parameters-display.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    InputComponent,
    SelectionComponent,
    SwitchComponent,
    TooltipDirective,
  ],
})
export class ItemParametersDisplayComponent {
  form = input.required<ItemParametersDisplayForm>();
  imageUrlForm = input<UntypedFormGroup>();
  showChildrenLayout = input(false);
  showImageUrl = input(false);

  readonly childrenLayoutOptions: { label: string, value: ItemChildrenLayout }[] = [
    { label: $localize`List`, value: 'List' },
    { label: $localize`Grid`, value: 'Grid' },
    { label: $localize`Hide`, value: 'Hide' },
  ];

  /**
   * Reactive imageUrl value used by the "must start with https://" warning. The form value lives
   * outside Angular's change detection cycle, so we lift it into a signal via `toSignal`.
   */
  readonly imageUrlValue = toSignal(
    toObservable(computed(() => this.imageUrlForm()?.get('imageUrl') ?? null)).pipe(
      switchMap(control => (
        control ? control.valueChanges.pipe(startWith(control.value as string | null)) : of<string | null>(null)
      )),
    ),
    { initialValue: null as string | null },
  );
}
