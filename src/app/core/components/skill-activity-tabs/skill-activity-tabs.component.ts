import { Component, Input } from '@angular/core';
import { ItemTypeCategory } from 'src/app/shared/helpers/item-type';

@Component({
  selector: 'alg-skill-activity-tabs',
  templateUrl: './skill-activity-tabs.component.html',
  styleUrls: [ './skill-activity-tabs.component.scss' ],
})
export class SkillActivityTabsComponent {

  @Input() backgroundColor: 'dark' | 'light' = 'dark';
  currentSelection: ItemTypeCategory = 'activity';

  onSelectionChangedByIdx(e: { index: number }): void {
    this.currentSelection = e.index === 0 ? 'skill' : 'activity';
  }

  onSelectionChanged(cat: ItemTypeCategory): void {
    this.currentSelection = cat;
  }
}
