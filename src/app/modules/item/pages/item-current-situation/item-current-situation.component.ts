import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { Group } from '../../../group/http-services/get-group-by-id.service';
import { RouterLinkActive } from '@angular/router';
import { ItemType } from 'src/app/shared/helpers/item-type';

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

  hideSelection = false;
  showChapterUserProgress = false;

  constructor() {}

  ngOnChanges(): void {
    const type = this.itemData?.item?.type;

    if (!type) {
      return;
    }

    this.hideSelection = this.getHideSelection(type);

    if (this.hideSelection) {
      return;
    }

    this.showChapterUserProgress = this.getShowChapterUserProgress(type);
  }

  private getHideSelection(type: ItemType): boolean {
    return !this.watchedGroup && [ 'Task', 'Course' ].includes(type);
  }

  private getShowChapterUserProgress(type: ItemType): boolean {
    return !this.watchedGroup && type === 'Chapter';
  }

}
