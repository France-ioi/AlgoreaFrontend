import { Component } from '@angular/core';
import { ItemTypeCategory } from 'src/app/shared/helpers/item-type';

@Component({
  selector: 'alg-left-nav',
  templateUrl: './left-nav.component.html',
  styleUrls: [ './left-nav.component.scss' ]
})
export class LeftNavComponent {

  currentSelection: ItemTypeCategory = 'activity';

  onSelectionChangedByIdx(e: { index: number }): void {
    switch (e.index) {
      case 0:
        this.currentSelection = 'activity';
        break;
      case 1:
        this.currentSelection = 'skill';
        break;
      case 2:
      default:
        this.currentSelection = 'activity'; // change to 'groups'
    }
  }

  onSelectionChanged(cat: ItemTypeCategory): void {
    this.currentSelection = cat;
  }

}
