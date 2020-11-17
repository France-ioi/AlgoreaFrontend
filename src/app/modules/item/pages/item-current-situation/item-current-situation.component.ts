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
    { label: 'Chapter view', route: './chapter' },
    { label: 'Log view', route: './' }
  ];

  viewSelected = 1;

  constructor() {}

  onViewChanged(selectedIdx: number): void {
    this.viewSelected = selectedIdx;
  }

}
