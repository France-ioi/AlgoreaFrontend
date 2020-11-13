import { Component, Input, OnChanges } from '@angular/core';
import { ItemChild } from './item-children';

@Component({
  selector: 'alg-item-children-edit',
  templateUrl: './item-children-edit.component.html',
  styleUrls: [ './item-children-edit.component.scss' ]
})
export class ItemChildrenEditComponent implements OnChanges {

  @Input() data: ItemChild[] = [
    { id: '100', title: 'First item', order: 1 },
    { id: '50', title: 'Second item', order: 2 },
  ];

  constructor() {}

  ngOnChanges(): void {
    this.data = this.data.sort((a, b) => a.order - b.order);
  }

}
