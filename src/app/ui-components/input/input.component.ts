import { Component, effect, input, output, signal } from '@angular/core';
import { UntypedFormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormErrorComponent } from '../form-error/form-error.component';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';

@Component({
  selector: 'alg-input',
  templateUrl: './input.component.html',
  styleUrls: [ './input.component.scss' ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    FormErrorComponent,
    TooltipDirective,
  ]
})
export class InputComponent {
  name = input(''); // name of the input in the parent form
  parentForm = input<UntypedFormGroup>();

  placeholder = input(''); // avoid 'undefined' if no placeholder specified
  inputType = input('text');
  inputIcon = input('');
  buttonIcon = input<string>(); // a phosphor-icon identifier for the input button
  hasClearButton = input(false);
  subtleFocus = input(false);

  tooltipText = input('');
  tooltipEvent = input<'hover' | 'focus'>('hover');
  tooltipPosition = input<'left' | 'right' | 'top' | 'bottom'>('right');
  tooltipDisabled = input(false);

  click = output<void>();
  focus = output<FocusEvent>();
  blur = output<FocusEvent>();

  /** Tracks form control value so the clear button stays in sync under OnPush. */
  protected readonly hasValue = signal(false);

  constructor() {
    effect(onCleanup => {
      const form = this.parentForm();
      const controlName = this.name();
      if (!form || !controlName) {
        this.hasValue.set(false);
        return;
      }
      const control = form.get(controlName);
      if (!control) {
        this.hasValue.set(false);
        return;
      }
      this.setHasValue(control.value);
      const sub = control.valueChanges.subscribe(value => {
        this.setHasValue(value);
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  private setHasValue(value: unknown): void {
    this.hasValue.set(value !== null && value !== undefined && value !== '');
  }

  onButtonClick(): void {
    this.click.emit();
  }

  clearInput(): void {
    this.parentForm()?.get(this.name())?.reset('');
  }
}
