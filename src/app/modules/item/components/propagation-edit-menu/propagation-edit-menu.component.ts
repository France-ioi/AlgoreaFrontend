import { Component, Output, EventEmitter, Input } from '@angular/core';
import { ChildData } from '../item-children-edit/item-children-edit.component';

@Component({
  selector: 'alg-propagation-edit-menu',
  templateUrl: 'propagation-edit-menu.component.html',
  styleUrls: [ 'propagation-edit-menu.component.scss' ],
})
export class PropagationEditMenuComponent {
  @Input() childData?: ChildData;
  @Output() clickEvent = new EventEmitter<'none' | 'as_info' | 'as_content'>();

  onClick(contentViewPropagation: 'none' | 'as_info' | 'as_content'): void {
    this.clickEvent.emit(contentViewPropagation);
  }
}
