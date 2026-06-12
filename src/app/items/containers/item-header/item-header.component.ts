import { Component, input } from '@angular/core';
import { ItemData } from '../../models/item-data';


@Component({
  selector: 'alg-item-header',
  templateUrl: './item-header.component.html',
  styleUrls: [ './item-header.component.scss' ],
})
export class ItemHeaderComponent {
  itemData = input.required<ItemData>();
}
