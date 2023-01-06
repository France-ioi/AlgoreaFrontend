import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ItemTypeCategory } from '../../../../shared/helpers/item-type';
import { ItemChildWithAdditions } from '../sub-skills/sub-skills.component';

@Component({
  selector: 'alg-item-children-list',
  templateUrl: './item-children-list.component.html',
  styleUrls: [ './item-children-list.component.scss' ],
})
export class ItemChildrenListComponent {
  @Output() clickEvent = new EventEmitter<ItemChildWithAdditions>();
  @Input() type: ItemTypeCategory = 'activity';
  @Input() children: ItemChildWithAdditions[] = [];
  @Input() emptyMessage = $localize`This skill does not have related activities.`;

  click(child: ItemChildWithAdditions): void {
    this.clickEvent.emit(child);
  }
}
