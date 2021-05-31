import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { Group } from '../../../group/http-services/get-group-by-id.service';
import { RouterLinkActive } from '@angular/router';

@Component({
  selector: 'alg-item-current-situation',
  templateUrl: './item-current-situation.component.html',
  styleUrls: [ './item-current-situation.component.scss' ]
})
export class ItemCurrentSituationComponent implements OnChanges {
  @Input() itemData?: ItemData;
  @Input() watchedGroup?: Group;

  @ViewChild('historyTab') historyTab?: RouterLinkActive;
  @ViewChild('chapterGroupProgressTab') chapterGroupProgressTab?: RouterLinkActive;
  @ViewChild('chapterUserProgressTab') chapterUserProgressTab?: RouterLinkActive;

  selectors: 'none' | 'withUserProgress' | 'withGroupProgress' = 'withGroupProgress';

  constructor() {}

  ngOnChanges(): void {
    const type = this.itemData?.item?.type;

    if (!type) {
      return;
    }

    if (!this.watchedGroup && [ 'Task', 'Course' ].includes(type)) {
      this.selectors = 'none';
    } else if (!this.watchedGroup && type === 'Chapter') {
      this.selectors = 'withUserProgress';
    } else {
      this.selectors = 'withGroupProgress';
    }
  }

}
