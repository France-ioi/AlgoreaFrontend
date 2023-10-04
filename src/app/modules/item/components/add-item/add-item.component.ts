import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import {
  NewContentType,
  AddedContent,
  AddContentComponent
} from 'src/app/modules/shared-components/components/add-content/add-content.component';
import { isSkill, ItemType, ItemTypeCategory } from 'src/app/shared/helpers/item-type';
import { getAllowedNewItemTypes } from 'src/app/shared/helpers/new-item-types';
import { SearchItemService } from '../../http-services/search-item.service';
import { AddContentComponent as AddContentComponent_1 } from '../../../shared-components/components/add-content/add-content.component';
import { SubSectionComponent } from '../../../shared-components/components/sub-section/sub-section.component';

@Component({
  selector: 'alg-add-item',
  templateUrl: './add-item.component.html',
  styleUrls: [ './add-item.component.scss' ],
  standalone: true,
  imports: [ SubSectionComponent, AddContentComponent_1 ]
})
export class AddItemComponent implements OnChanges {
  @ViewChild('addContentComponent') addContentComponent?: AddContentComponent<ItemType>;

  @Input() type: ItemTypeCategory = 'activity';
  @Input() addedItemIds: string[] = [];
  @Output() contentAdded = new EventEmitter<AddedContent<ItemType>>();

  allowedNewItemTypes: NewContentType<ItemType>[] = [];

  searchFunction = (value: string): Observable<AddedContent<ItemType>[]> =>
    this.searchItemService.search(
      value, getAllowedNewItemTypes({ allowActivities: !isSkill(this.type), allowSkills: isSkill(this.type) }).map(item => item.type)
    );

  constructor(
    private searchItemService: SearchItemService
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {
    this.allowedNewItemTypes = getAllowedNewItemTypes({ allowActivities: !isSkill(this.type), allowSkills: isSkill(this.type) });
  }

  addChild(item: AddedContent<ItemType>): void {
    this.contentAdded.emit(item);
    this.addContentComponent?.reset();
  }
}
