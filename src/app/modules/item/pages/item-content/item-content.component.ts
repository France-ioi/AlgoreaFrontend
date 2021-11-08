import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { ConfigureTaskOptions } from '../../services/item-task.service';
import { TaskTab } from '../item-display/item-display.component';

@Component({
  selector: 'alg-item-content',
  templateUrl: './item-content.component.html',
  styleUrls: [ './item-content.component.scss' ]
})
export class ItemContentComponent implements OnChanges {

  @Input() itemData?: ItemData;
  @Input() taskView?: TaskTab['view'];
  @Input() taskOptions: ConfigureTaskOptions = { readOnly: false, shouldLoadAnswer: true };

  @Output() taskTabsChange = new EventEmitter<TaskTab[]>();
  @Output() taskViewChange = new EventEmitter<TaskTab['view']>();

  attemptId?: string;

  ngOnChanges(): void {
    if (!this.itemData) return;
    this.attemptId = this.itemData.route.attemptId || this.itemData.currentResult?.attemptId;
  }

}
