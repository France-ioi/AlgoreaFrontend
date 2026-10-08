import { Component, input, signal } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { TextareaComponent } from 'src/app/ui-components/textarea/textarea.component';
import { PreviewHtmlComponent } from 'src/app/containers/preview-html/preview-html.component';
import { ItemEditContentHelpComponent } from './item-edit-content-help/item-edit-content-help.component';
import { ITEM_DESCRIPTION_MAX_LENGTH } from 'src/app/items/containers/item-strings-form-group/item-strings-validators';

type Tab = 'write' | 'preview' | 'help';

@Component({
  selector: 'alg-item-edit-content',
  templateUrl: './item-edit-content.component.html',
  styleUrl: './item-edit-content.component.scss',
  imports: [ TextareaComponent, PreviewHtmlComponent, ItemEditContentHelpComponent ]
})
export class ItemEditContentComponent {
  parentForm = input.required<UntypedFormGroup>();

  protected readonly descriptionMaxLength = ITEM_DESCRIPTION_MAX_LENGTH;

  activeTab = signal<Tab>('write');

  onTabChange(tab: Tab): void {
    this.activeTab.set(tab);
  }
}
