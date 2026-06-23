import { Component, input, output } from '@angular/core';

@Component({
  selector: 'alg-sub-section',
  templateUrl: './sub-section.component.html',
  styleUrl: './sub-section.component.scss',
})
export class SubSectionComponent {
  label = input.required<string>();
  tooltip = input<string>();
  canClose = input(false);

  close = output<MouseEvent>();

  onCloseEvent(e: MouseEvent): void {
    this.close.emit(e);
  }

}
