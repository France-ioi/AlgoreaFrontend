import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { startWith, switchMap } from 'rxjs';
import { InputComponent } from 'src/app/ui-components/input/input.component';
import { SelectionComponent } from 'src/app/ui-components/selection/selection.component';
import { SwitchComponent } from 'src/app/ui-components/switch/switch.component';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';
import { ItemChildrenLayout } from 'src/app/items/models/item-parameters';

export type ItemParametersDisplayForm = FormGroup<{
  promptToJoinGroupByCode: FormControl<boolean>,
  childrenLayout: FormControl<ItemChildrenLayout>,
  thumbnailUrl: FormControl<string>,
  disableChildrenPrevNextNav: FormControl<boolean>,
}>;

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
  showChildrenLayout = input(false);
  showThumbnailUrl = input(false);
  showDisableChildrenPrevNextNav = input(false);

  readonly childrenLayoutOptions: { label: string, value: ItemChildrenLayout }[] = [
    { label: $localize`List`, value: 'List' },
    { label: $localize`Grid`, value: 'Grid' },
    { label: $localize`Hide`, value: 'Hide' },
  ];

  /**
   * Reactive thumbnailUrl value used by the "must start with https://" warning. The form value lives
   * outside Angular's change detection cycle, so we lift it into a signal via `toSignal`.
   */
  readonly thumbnailUrlValue = toSignal(
    toObservable(computed(() => this.form().controls.thumbnailUrl)).pipe(
      switchMap(control => control.valueChanges.pipe(startWith(control.value))),
    ),
    { initialValue: '' },
  );
}
