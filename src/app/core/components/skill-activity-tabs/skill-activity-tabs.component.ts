import { Component, Input } from '@angular/core';
import { Category } from 'src/app/shared/helpers/item-category';

@Component({
  selector: 'alg-skill-activity-tabs',
  templateUrl: './skill-activity-tabs.component.html',
  styleUrls: [ './skill-activity-tabs.component.scss' ],
})
export class SkillActivityTabsComponent {

  @Input() backgroundColor: 'dark' | 'light' = 'dark';
  currentSelection: Category = 'activity';

  onSelectionChanged(newSelection: Category): void {
    this.currentSelection = newSelection;
  }
}
