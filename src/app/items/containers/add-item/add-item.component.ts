import { Component, computed, EventEmitter, input, Input, OnChanges, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  NewContentType,
  AddedContent,
  AddContentComponent
} from 'src/app/ui-components/add-content/add-content.component';
import { ItemType, ItemTypeCategory, itemTypeCategoryEnum } from 'src/app/items/models/item-type';
import { getAllowedNewItemTypes } from 'src/app/items/models/new-item-types';
import { SearchItemService } from 'src/app/data-access/search-item.service';
import { AddContentComponent as AddContentComponent_1 } from 'src/app/ui-components/add-content/add-content.component';
import { SubSectionComponent } from 'src/app/ui-components/sub-section/sub-section.component';

@Component({
  selector: 'alg-add-item',
  templateUrl: './add-item.component.html',
  styleUrls: [ './add-item.component.scss' ],
  imports: [ SubSectionComponent, AddContentComponent_1 ]
})
export class AddItemComponent implements OnChanges {
  private searchItemService = inject(SearchItemService);

  @ViewChild('addContentComponent') addContentComponent?: AddContentComponent<ItemType>;

  type = input<ItemTypeCategory>('activity');
  isSkill = computed(() => this.type() === itemTypeCategoryEnum.skill);

  @Input() addedItemIds: string[] = [];
  @Output() contentAdded = new EventEmitter<AddedContent<ItemType>>();

  allowedNewItemTypes: NewContentType<ItemType>[] = [];

  searchFunction = (value: string): Observable<AddedContent<ItemType>[]> =>
    this.searchItemService.search(
      value, getAllowedNewItemTypes({ allowActivities: !this.isSkill(), allowSkills: this.isSkill() }).map(item => item.type)
    );

  ngOnChanges(_changes: SimpleChanges): void {
    this.allowedNewItemTypes = getAllowedNewItemTypes({ allowActivities: !this.isSkill(), allowSkills: this.isSkill() });
  }

  addChild(item: AddedContent<ItemType>): void {
    this.contentAdded.emit(item);
    this.addContentComponent?.reset();
  }
}
