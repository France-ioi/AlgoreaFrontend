import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'alg-switch',
  templateUrl: './switch.component.html',
  styleUrls: [ './switch.component.scss' ],
})
export class SwitchComponent {
  @Input() checked = false;
  @Input() mode: 'dark' | 'white' | 'circular' | 'dark-circular' = 'dark';
  @Input() type = 'square';

  @Output() change = new EventEmitter<boolean>();

  handleChange(checked: boolean): void {
    this.change.emit(checked);
  }
}
