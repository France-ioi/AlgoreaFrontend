import { Component, Input, OnChanges } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { UserSession } from '../../../../shared/services/user-session.service';
import { Group } from '../../../group/http-services/get-group-by-id.service';
import { Column } from '../item-log-view/item-log-view.component';

interface ViewItem {
  label: string,
  value: string,
}

@Component({
  selector: 'alg-item-current-situation',
  templateUrl: './item-current-situation.component.html',
  styleUrls: [ './item-current-situation.component.scss' ]
})
export class ItemCurrentSituationComponent implements OnChanges {
  @Input() itemData?: ItemData;
  @Input() session: UserSession | null |undefined;
  @Input() watchedGroup?: Group;

  viewItems?: ViewItem[];
  viewSelectedIndex = 0;
  viewSelected?: ViewItem;
  hideSelection = false;
  type?: 'Chapter' | 'Task' | 'Course' | 'Skill';
  logColumns?: Column[];

  constructor() {}

  ngOnChanges(): void {
    if (!this.itemData) {
      return;
    }

    this.type = this.itemData.item.type;
    this.viewItems = this.getViewItems();
    this.hideSelection = this.getHideSelection();
    this.logColumns = this.getLogColumns();
    this.changeView(this.viewSelectedIndex);
  }

  getViewItems(): ViewItem[] {
    const logItemCaption = !this.watchedGroup && this.type === 'Chapter'
      || !!this.watchedGroup && !!this.type && [ 'Task', 'Course' ].includes(this.type) ? $localize`History` : $localize`Log view`;
    const chapterViewValue = !this.watchedGroup && this.type === 'Chapter' ? 'chapter-user-progress' : 'chapter';

    return [
      { label: logItemCaption, value: 'log' },
      { label: $localize`Chapter view`, value: chapterViewValue },
    ];
  }

  onViewChanged(selectedIdx: number): void {
    this.changeView(selectedIdx);
  }

  changeView(index: number): void {
    if (!this.viewItems) {
      return;
    }

    this.viewSelectedIndex = index;
    this.viewSelected = this.viewItems[index];
  }

  getLogColumns(): Column[] {
    const columns = [
      {
        field: 'activity_type',
        header: $localize`Action`,
        enabled: true,
      },
      {
        field: 'item.string.title',
        header: $localize`Content`,
        enabled: !!this.type && ![ 'Task', 'Course' ].includes(this.type),
      },
      {
        field: 'item.user',
        header: $localize`User`,
        enabled: !!this.watchedGroup && !!this.type && [ 'Chapter', 'Task', 'Course' ].includes(this.type),
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

  getHideSelection(): boolean {
    return !this.watchedGroup && !!this.type && [ 'Task', 'Course' ].includes(this.type);
  }

}
