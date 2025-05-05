import { Component, input, model, OnChanges, output, signal, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';

@Component({
  selector: 'alg-item-extra-time-input',
  templateUrl: './item-extra-time-input.component.html',
  styleUrls: [ './item-extra-time-input.component.scss' ],
  standalone: true,
  imports: [
    FormsModule,
    InputNumberModule,
    ButtonIconComponent,
  ],
})
export class ItemExtraTimeInputComponent implements OnChanges {
  value = model.required<number>();
  disabled = input(false);
  defaultValue = signal(0);
  saveEvent = output<number>();

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['disabled'] || changes['value']) {
      this.defaultValue.set(this.value());
    }
  }

  onSave(): void {
    this.saveEvent.emit(this.value());
  }
}
