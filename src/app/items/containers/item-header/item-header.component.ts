import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { ItemData } from '../../models/item-data';


@Component({
  selector: 'alg-item-header',
  templateUrl: './item-header.component.html',
  styleUrls: [ './item-header.component.scss' ],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: []
})
export class ItemHeaderComponent {
  @Input() itemData?: ItemData;

}
