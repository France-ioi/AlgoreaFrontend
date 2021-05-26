import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { Group } from '../../../group/http-services/get-group-by-id.service';
import { Column } from '../item-log-view/item-log-view.component';
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
  @ViewChild('chapterTab') chapterTab?: RouterLinkActive;
  @ViewChild('chapterUserProgressTab') chapterUserProgressTab?: RouterLinkActive;

  hideSelection = false;
  showChapterUserProgress = false;
  logColumns?: Column[];

  constructor() {}

  ngOnChanges(): void {
    const type = this.itemData?.item?.type;

    if (!type) {
      return;
    }

    this.hideSelection = this.getHideSelection(type);
    this.logColumns = this.getLogColumns(type);

    if (this.hideSelection) {
      return;
    }

    this.showChapterUserProgress = this.getShowChapterUserProgress(type);
  }

  private getLogColumns(type: ItemType): Column[] {
    const columns = [
      {
        field: 'activity_type',
        header: $localize`Action`,
        enabled: true,
      },
      {
        field: 'item.string.title',
        header: $localize`Content`,
        enabled: ![ 'Task', 'Course' ].includes(type),
      },
      {
        field: 'item.user',
        header: $localize`User`,
        enabled: !!this.watchedGroup && [ 'Chapter', 'Task', 'Course' ].includes(type),
      },
      {
        field: 'at',
        header: $localize`Time`,
        enabled: true,
      }
    ];

    return columns.filter(item => item.enabled).map(item => ({
      field: item.field,
      header: item.header,
    }));
  }

  private getHideSelection(type: ItemType): boolean {
    return !this.watchedGroup && [ 'Task', 'Course' ].includes(type);
  }

  private getShowChapterUserProgress(type: ItemType): boolean {
    return !this.watchedGroup && type === 'Chapter';
  }

}
