import { Component, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { TaskConfig } from '../../services/item-task.service';
import { ItemDisplayComponent, TaskTab } from '../item-display/item-display.component';

@Component({
  selector: 'alg-item-content',
  templateUrl: './item-content.component.html',
  styleUrls: [ './item-content.component.scss' ]
})
export class ItemContentComponent implements OnChanges {
  @ViewChild(ItemDisplayComponent) itemDisplayComponent?: ItemDisplayComponent;

  @Input() itemData?: ItemData;
  @Input() taskView?: TaskTab['view'];
  @Input() taskConfig: TaskConfig = { readOnly: false, formerAnswer: null };

  @Output() taskTabsChange = new EventEmitter<TaskTab[]>();
  @Output() taskViewChange = new EventEmitter<TaskTab['view']>();
  @Output() scoreChange = new EventEmitter<number>();

  attemptId?: string;

  ngOnChanges(): void {
    if (!this.itemData) return;
    this.attemptId = this.itemData.route.attemptId || this.itemData.currentResult?.attemptId;
  }

}
