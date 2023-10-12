import { Component, Output, EventEmitter, Input } from '@angular/core';
import { PossiblyInvisibleChildData } from '../item-children-edit/item-children-edit.component';
import { AllowsGrantingViewItemPipe, AllowsGrantingContentViewItemPipe } from 'src/app/models/item-grant-view-permission';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'alg-propagation-edit-menu',
  templateUrl: 'propagation-edit-menu.component.html',
  styleUrls: [ 'propagation-edit-menu.component.scss' ],
  standalone: true,
  imports: [
    NgClass,
    NgIf,
    AllowsGrantingViewItemPipe,
    AllowsGrantingContentViewItemPipe,
  ],
})
export class PropagationEditMenuComponent {
  @Input() childData?: PossiblyInvisibleChildData;
  @Output() clickEvent = new EventEmitter<'none' | 'as_info' | 'as_content'>();

  onClick(contentViewPropagation: 'none' | 'as_info' | 'as_content'): void {
    this.clickEvent.emit(contentViewPropagation);
  }
}
