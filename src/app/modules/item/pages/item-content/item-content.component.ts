import { Component, Input, OnChanges } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';

@Component({
  selector: 'alg-item-content',
  templateUrl: './item-content.component.html',
  styleUrls: [ './item-content.component.scss' ]
})
export class ItemContentComponent implements OnChanges {

  @Input() itemData?: ItemData;

  attemptId?: string;

  ngOnChanges(): void {
    if (!this.itemData) return;
    this.attemptId = this.itemData.route.attemptId || this.itemData.currentResult?.attemptId;
  }

}
