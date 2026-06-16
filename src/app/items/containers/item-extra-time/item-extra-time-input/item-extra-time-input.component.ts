import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { InputNumberComponent } from 'src/app/ui-components/input-number/input-number.component';

@Component({
  selector: 'alg-item-extra-time-input',
  templateUrl: './item-extra-time-input.component.html',
  styleUrls: [ './item-extra-time-input.component.scss' ],
  imports: [
    FormsModule,
    ButtonIconComponent,
    InputNumberComponent,
  ]
})
export class ItemExtraTimeInputComponent {
  inputStyleClass = input('');
  inputWidth = input<string>();
  initialValue = input.required<number>();
  value = signal<number | null>(null); // The p-inputNumber value is nullable
  disabled = input(false);
  saveEvent = output<number>();

  constructor() {
    effect(() => {
      this.value.set(this.initialValue());
    });
  }

  onSave(): void {
    const value = this.value();
    if (value !== null) {
      this.saveEvent.emit(value);
    }
  }
}
