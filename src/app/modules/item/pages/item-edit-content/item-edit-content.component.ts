import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { ItemData } from '../../services/item-datasource.service';
import { PossiblyInvisibleChildData } from '../../components/item-children-edit/item-children-edit.component';

@Component({
  selector: 'alg-item-edit-content',
  templateUrl: './item-edit-content.component.html',
  styleUrls: [ './item-edit-content.component.scss' ]
})
export class ItemEditContentComponent {
  @Input() parentForm?: UntypedFormGroup;
  @Input() itemData? : ItemData;

  @Output() childrenChanges = new EventEmitter<PossiblyInvisibleChildData[]>();

  constructor() {}

}
