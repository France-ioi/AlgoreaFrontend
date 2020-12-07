import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ItemData } from '../../services/item-datasource.service';
import { ChildData, ItemChildrenEditComponent } from '../../components/item-children-edit/item-children-edit.component';

@Component({
  selector: 'alg-item-edit-content',
  templateUrl: './item-edit-content.component.html',
  styleUrls: [ './item-edit-content.component.scss' ]
})
export class ItemEditContentComponent {
  @Input() parentForm?: FormGroup;
  @Input() itemData? : ItemData;

  @Output() childrenChanges = new EventEmitter<ChildData[]>();

  @ViewChild('childrenEdit') private childrenEdit?: ItemChildrenEditComponent;

  constructor() {}

  reset(): void {
    this.childrenEdit?.reset();
  }

}
