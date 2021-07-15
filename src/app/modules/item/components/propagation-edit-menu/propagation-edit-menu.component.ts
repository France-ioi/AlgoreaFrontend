import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'alg-propagation-edit-menu',
  templateUrl: 'propagation-edit-menu.component.html',
  styleUrls: ['propagation-edit-menu.component.scss'],
})
export class PropagationEditMenuComponent {
  @Output() clickEvent = new EventEmitter<'none' | 'as_info' | 'as_content'>();

  onClick(contentViewPropagation: 'none' | 'as_info' | 'as_content'): void {
    this.clickEvent.emit(contentViewPropagation);
  }
}
