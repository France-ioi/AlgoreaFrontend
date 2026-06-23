import { Component, input, output } from '@angular/core';
import { PossiblyInvisibleChildData } from '../item-children-edit/item-children-edit.component';
import { AllowsGrantingViewItemPipe, AllowsGrantingContentViewItemPipe } from 'src/app/items/models/item-grant-view-permission';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';

@Component({
  selector: 'alg-propagation-edit-menu',
  templateUrl: 'propagation-edit-menu.component.html',
  styleUrl: 'propagation-edit-menu.component.scss',
  imports: [
    AllowsGrantingViewItemPipe,
    AllowsGrantingContentViewItemPipe,
    ButtonComponent,
    TooltipDirective,
  ]
})
export class PropagationEditMenuComponent {
  openAdvancedConfigurationDialogEvent = output<void>();
  childData = input.required<PossiblyInvisibleChildData>();
  clickEvent = output<'none' | 'as_info' | 'as_content'>();

  onClick(contentViewPropagation: 'none' | 'as_info' | 'as_content'): void {
    this.clickEvent.emit(contentViewPropagation);
  }
}
