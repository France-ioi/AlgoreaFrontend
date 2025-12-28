import { Component, Output, EventEmitter, Input, output } from '@angular/core';
import { PossiblyInvisibleChildData } from '../item-children-edit/item-children-edit.component';
import { AllowsGrantingViewItemPipe, AllowsGrantingContentViewItemPipe } from 'src/app/items/models/item-grant-view-permission';
import { NgClass } from '@angular/common';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';

@Component({
  selector: 'alg-propagation-edit-menu',
  templateUrl: 'propagation-edit-menu.component.html',
  styleUrls: [ 'propagation-edit-menu.component.scss' ],
  imports: [
    NgClass,
    AllowsGrantingViewItemPipe,
    AllowsGrantingContentViewItemPipe,
    ButtonComponent,
    TooltipDirective,
  ]
})
export class PropagationEditMenuComponent {
  openAdvancedConfigurationDialogEvent = output<void>();
  @Input() childData?: PossiblyInvisibleChildData;
  @Output() clickEvent = new EventEmitter<'none' | 'as_info' | 'as_content'>();

  onClick(contentViewPropagation: 'none' | 'as_info' | 'as_content'): void {
    this.clickEvent.emit(contentViewPropagation);
  }
}
