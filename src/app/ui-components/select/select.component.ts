import {
  Component,
  computed,
  contentChildren,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { SelectOption, SelectOptionComponent } from 'src/app/ui-components/select/select-option/select-option.component';
import {
  ConnectedPosition,
  Overlay,
  CdkOverlayOrigin,
  CdkConnectedOverlay,
} from '@angular/cdk/overlay';

@Component({
  selector: 'alg-select',
  templateUrl: './select.component.html',
  styleUrls: [ './select.component.scss' ],
  standalone: true,
  imports: [
    ButtonComponent,
    CdkOverlayOrigin,
    CdkConnectedOverlay,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
})
export class SelectComponent implements ControlValueAccessor {
  trigger = viewChild.required<CdkOverlayOrigin>('trigger');
  change = output<SelectOption>();
  selectedValue = signal<string | null>(null);
  selected = computed(() =>
    this.options().find(o => o.value().value === this.selectedValue())?.value()
  );
  buttonStyleClass = input('select-button stroke size-s');
  isOpen = signal<boolean>(false);
  positions = signal<ConnectedPosition[]>([
    {
      originX: 'center',
      originY: 'bottom',
      overlayX: 'center',
      overlayY: 'top',
    },
    {
      originX: 'center',
      originY: 'top',
      overlayX: 'center',
      overlayY: 'bottom',
    },
  ]);
  private options = contentChildren(SelectOptionComponent);
  el = inject<ElementRef<HTMLElement>>(ElementRef);
  overlay = inject(Overlay);
  scrollStrategy = this.overlay.scrollStrategies.reposition();

  private onChange: (value: string) => void = () => {};

  constructor() {
    effect(() => {
      this.options().forEach(o => {
        o.select = (value: SelectOption): void => {
          this.selectedValue.set(value.value);
          this.onChange(value.value);
          this.change.emit(value);
          this.isOpen.set(false);
        };
        o.selected = o.value().value === this.selectedValue();
      });
    });
  }

  writeValue(value: string | null): void {
    this.selectedValue.set(value);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: (value: string) => void): void {
  }
}
