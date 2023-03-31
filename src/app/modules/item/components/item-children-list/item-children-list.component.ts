import { Component, Input } from '@angular/core';
import { ItemTypeCategory } from '../../../../shared/helpers/item-type';
import { ItemChildWithAdditions } from './item-children';
import { ItemData } from '../../services/item-datasource.service';

@Component({
  selector: 'alg-item-children-list',
  templateUrl: './item-children-list.component.html',
  styleUrls: [ './item-children-list.component.scss' ],
})
export class ItemChildrenListComponent {
  @Input() type: ItemTypeCategory = 'activity';
  @Input() itemData?: ItemData;
  @Input() children: ItemChildWithAdditions[] = [];
  @Input() emptyMessage?: string;
  @Input() showStateWidget = false;
}
