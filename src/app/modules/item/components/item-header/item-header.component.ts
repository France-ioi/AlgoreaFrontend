import { Component, Input } from '@angular/core';
import { Item } from '../../http-services/get-item-by-id.service';

@Component({
  selector: 'alg-item-header',
  templateUrl: './item-header.component.html',
  styleUrls: ['./item-header.component.scss']
})
export class ItemHeaderComponent {
  @Input() item?: Item;
}
