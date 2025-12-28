import { Component, Input } from '@angular/core';
import { ItemData } from '../../models/item-data';
import { NgIf } from '@angular/common';

@Component({
  selector: 'alg-item-header',
  templateUrl: './item-header.component.html',
  styleUrls: [ './item-header.component.scss' ],
  imports: [ NgIf ]
})
export class ItemHeaderComponent {
  @Input() itemData?: ItemData;

  constructor() {}

}
