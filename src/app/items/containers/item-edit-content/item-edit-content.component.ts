import { Component, input, signal } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { TextareaComponent } from 'src/app/ui-components/textarea/textarea.component';
import { PreviewHtmlComponent } from 'src/app/containers/preview-html/preview-html.component';
import { ItemEditContentHelpComponent } from './item-edit-content-help/item-edit-content-help.component';

type Tab = 'write' | 'preview' | 'help';

@Component({
  selector: 'alg-item-edit-content',
  templateUrl: './item-edit-content.component.html',
  styleUrls: [ './item-edit-content.component.scss' ],
  imports: [ TextareaComponent, PreviewHtmlComponent, ItemEditContentHelpComponent ]
})
export class ItemEditContentComponent {
  parentForm = input.required<UntypedFormGroup>();

  activeTab = signal<Tab>('write');

  onTabChange(tab: Tab): void {
    this.activeTab.set(tab);
  }
}
