import {
  Component, computed, input, output, viewChild, inject,
} from '@angular/core';
import { Observable } from 'rxjs';
import {
  AddedContent,
  AddContentComponent,
} from 'src/app/ui-components/add-content/add-content.component';
import { ItemType, ItemTypeCategory, itemTypeCategoryEnum } from 'src/app/items/models/item-type';
import { getAllowedNewItemTypes } from 'src/app/items/models/new-item-types';
import { SearchItemService } from 'src/app/data-access/search-item.service';
import { SubSectionComponent } from 'src/app/ui-components/sub-section/sub-section.component';

@Component({
  selector: 'alg-add-item',
  templateUrl: './add-item.component.html',
  styleUrls: [ './add-item.component.scss' ],
  imports: [ SubSectionComponent, AddContentComponent ]
})
export class AddItemComponent {
  private searchItemService = inject(SearchItemService);

  addContentComponent = viewChild<AddContentComponent<ItemType>>('addContentComponent');

  type = input<ItemTypeCategory>('activity');
  isSkill = computed(() => this.type() === itemTypeCategoryEnum.skill);

  addedItemIds = input.required<string[]>();
  contentAdded = output<AddedContent<ItemType>>();

  allowedNewItemTypes = computed(() =>
    getAllowedNewItemTypes({ allowActivities: !this.isSkill(), allowSkills: this.isSkill() })
  );

  searchFunction = (value: string): Observable<AddedContent<ItemType>[]> =>
    this.searchItemService.search(
      value, getAllowedNewItemTypes({ allowActivities: !this.isSkill(), allowSkills: this.isSkill() }).map(item => item.type)
    );

  addChild(item: AddedContent<ItemType>): void {
    this.contentAdded.emit(item);
    this.addContentComponent()?.reset();
  }
}
