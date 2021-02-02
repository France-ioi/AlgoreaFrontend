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
    this.currentSelection = e.index === 0 ? 'skill' : 'activity';
  }

  onSelectionChanged(cat: ItemTypeCategory): void {
    this.currentSelection = cat;
  }

}
