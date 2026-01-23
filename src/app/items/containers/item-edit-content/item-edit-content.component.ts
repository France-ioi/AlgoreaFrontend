import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { PossiblyInvisibleChildData } from 'src/app/items/models/item-children-edit';
import { TextareaComponent } from 'src/app/ui-components/textarea/textarea.component';
import { PreviewHtmlComponent } from 'src/app/containers/preview-html/preview-html.component';

type Tab = 'write' | 'preview';

@Component({
  selector: 'alg-item-edit-content',
  templateUrl: './item-edit-content.component.html',
  styleUrls: [ './item-edit-content.component.scss' ],
  imports: [ TextareaComponent, PreviewHtmlComponent ]
})
export class ItemEditContentComponent {
  @Input() parentForm?: UntypedFormGroup;

  @Output() childrenChanges = new EventEmitter<PossiblyInvisibleChildData[]>();

  activeTab = signal<Tab>('write');

  constructor() {}

  onTabChange(tab: Tab): void {
    this.activeTab.set(tab);
  }
}
