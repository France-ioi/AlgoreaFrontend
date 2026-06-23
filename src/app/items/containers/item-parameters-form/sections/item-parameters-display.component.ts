import { Component, computed, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { startWith, switchMap } from 'rxjs';
import { InputComponent } from 'src/app/ui-components/input/input.component';
import { SelectionComponent } from 'src/app/ui-components/selection/selection.component';
import { SwitchComponent } from 'src/app/ui-components/switch/switch.component';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';
import { ItemChildrenLayout } from 'src/app/items/models/item-parameters';
import { ItemType } from 'src/app/items/models/item-type';
import { defaultLeftNavIcon } from 'src/app/items/models/left-nav-icons';
import { ItemLeftNavIconSelectComponent } from './item-left-nav-icon-select.component';

export type ItemParametersDisplayForm = FormGroup<{
  promptToJoinGroupByCode: FormControl<boolean>,
  childrenLayout: FormControl<ItemChildrenLayout>,
  thumbnailUrl: FormControl<string>,
  disableChildrenPrevNextNav: FormControl<boolean>,
  hideHeader: FormControl<boolean>,
  showPlatformInsteadOfScore: FormControl<boolean>,
  leftNavIcon: FormControl<string>,
}>;

@Component({
  selector: 'alg-item-parameters-display',
  templateUrl: './item-parameters-display.component.html',
  styleUrl: './item-parameters-display.component.scss',
  imports: [
    ReactiveFormsModule,
    InputComponent,
    SelectionComponent,
    SwitchComponent,
    TooltipDirective,
    ItemLeftNavIconSelectComponent,
  ],
})
export class ItemParametersDisplayComponent {
  form = input.required<ItemParametersDisplayForm>();
  itemType = input.required<ItemType>();
  showChildrenLayout = input(false);
  showThumbnailUrl = input(false);
  showDisableChildrenPrevNextNav = input(false);
  showLeftNavIcon = input(false);

  readonly defaultLeftNavIcon = computed(() => defaultLeftNavIcon(this.itemType()));

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
