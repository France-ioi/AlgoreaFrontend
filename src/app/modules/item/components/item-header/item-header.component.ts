import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';

@Component({
  selector: 'alg-item-header',
  templateUrl: './item-header.component.html',
  styleUrls: [ './item-header.component.scss' ]
})
export class ItemHeaderComponent implements OnChanges {
  @Input() itemData?: ItemData;

  showAccessCodeField = false;

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.itemData) return;
    this.showAccessCodeField = this.itemData.item.prompt_to_join_group_by_code &&
      this.itemData.item.permissions.can_view !== 'none';
  }
}
