import { Component, Input } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';

@Component({
  selector: 'alg-item-current-situation',
  templateUrl: './item-current-situation.component.html',
  styleUrls: [ './item-current-situation.component.scss' ]
})
export class ItemCurrentSituationComponent {

  @Input() itemData?: ItemData;

  viewItems = [
    { label: $localize`Log view`, value: 'log' },
    { label: $localize`Chapter view`, value: 'chapter' },
  ];

  viewSelected = 0;

  constructor() {}

  onViewChanged(selectedIdx: number): void {
    this.viewSelected = selectedIdx;
  }
}
