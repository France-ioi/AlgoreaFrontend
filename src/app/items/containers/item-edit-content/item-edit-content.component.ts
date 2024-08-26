import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { ItemData } from '../../models/item-data';
import { PossiblyInvisibleChildData } from '../../containers/item-children-edit/item-children-edit.component';
import { TextareaComponent } from 'src/app/ui-components/textarea/textarea.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'alg-item-edit-content',
  templateUrl: './item-edit-content.component.html',
  styleUrls: [ './item-edit-content.component.scss' ],
  standalone: true,
  imports: [ NgIf, TextareaComponent ]
})
export class ItemEditContentComponent {
  @Input() parentForm?: UntypedFormGroup;
  @Input() itemData? : ItemData;

  @Output() childrenChanges = new EventEmitter<PossiblyInvisibleChildData[]>();

  constructor() {}

}
