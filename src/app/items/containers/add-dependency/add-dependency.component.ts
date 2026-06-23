import {
  Component, computed, input, output, viewChild, inject,
} from '@angular/core';
import {
  AddContentComponent,
  AddedContent,
} from 'src/app/ui-components/add-content/add-content.component';
import { getAllowedNewItemTypes } from 'src/app/items/models/new-item-types';
import { ItemType } from 'src/app/items/models/item-type';
import { Observable } from 'rxjs';
import { SearchItemService } from 'src/app/data-access/search-item.service';

@Component({
  selector: 'alg-add-dependency',
  templateUrl: './add-dependency.component.html',
  styleUrl: './add-dependency.component.scss',
  imports: [ AddContentComponent ]
})
export class AddDependencyComponent {
  private searchItemService = inject(SearchItemService);

  /** Kept for API symmetry; not bound at any call site today. */
  allowSkills = input(false);
  addedIds = input.required<string[]>();
  contentAdded = output<AddedContent<ItemType>>();

  addContentComponent = viewChild<AddContentComponent<ItemType>>('addContentComponent');

  allowedNewItemTypes = computed(() =>
    getAllowedNewItemTypes({ allowActivities: true, allowSkills: this.allowSkills() })
  );

  searchFunction = (value: string): Observable<AddedContent<ItemType>[]> =>
    this.searchItemService.search(
      value, getAllowedNewItemTypes({ allowActivities: true, allowSkills: this.allowSkills() }).map(item => item.type)
    );

  onAdd(item: AddedContent<ItemType>): void {
    this.contentAdded.emit(item);
  }
}
