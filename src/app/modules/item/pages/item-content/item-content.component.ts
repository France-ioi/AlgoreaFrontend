import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { TaskTab } from '../item-display/item-display.component';

@Component({
  selector: 'alg-item-content',
  templateUrl: './item-content.component.html',
  styleUrls: [ './item-content.component.scss' ]
})
export class ItemContentComponent implements OnChanges {

  @Input() itemData?: ItemData;
  @Output() tabs = new EventEmitter<TaskTab[]>();

  attemptId?: string;

  ngOnChanges(): void {
    if (!this.itemData) return;
    this.attemptId = this.itemData.route.attemptId || this.itemData.currentResult?.attemptId;
  }

}
