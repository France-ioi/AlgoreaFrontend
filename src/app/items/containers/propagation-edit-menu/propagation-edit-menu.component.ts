import { Component, computed, input, output } from '@angular/core';
import { PossiblyInvisibleChildData } from '../item-children-edit/item-children-edit.component';
import { AllowsGrantingViewItemPipe, AllowsGrantingContentViewItemPipe } from 'src/app/items/models/item-grant-view-permission';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';
import {
  ContentViewPropagation,
  contentViewPropagationDisplay,
} from 'src/app/items/models/content-view-propagation-display';

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
  clickEvent = output<ContentViewPropagation>();

  requiresExplicitEntry = computed(() => !!this.childData().requiresExplicitEntry);
  noneOption = computed(() => contentViewPropagationDisplay('none', this.requiresExplicitEntry()));
  asInfoOption = computed(() => contentViewPropagationDisplay('as_info', this.requiresExplicitEntry()));
  asContentOption = computed(() => contentViewPropagationDisplay('as_content', this.requiresExplicitEntry()));

  onClick(contentViewPropagation: ContentViewPropagation): void {
    this.clickEvent.emit(contentViewPropagation);
  }
}
