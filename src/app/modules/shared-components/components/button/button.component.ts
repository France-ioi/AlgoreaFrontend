import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'alg-button',
  templateUrl: './button.component.html',
  styleUrls: [ './button.component.scss' ],
})
export class ButtonComponent {
  @Input() label?: string;
  @Input() disabled = false;
  @Input() icon?: string;
  @Input() class?: string;
  @Input() iconPos = 'left';

  @Output() click = new EventEmitter<void>();

  onClickEvent(event: any): void {
    (event as Event).stopPropagation();
    this.click.emit();
  }
}
