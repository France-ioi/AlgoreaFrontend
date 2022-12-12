import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import {
  NewContentType,
  AddedContent,
  AddContentComponent
} from 'src/app/modules/shared-components/components/add-content/add-content.component';
import { ItemType } from 'src/app/shared/helpers/item-type';
import { getAllowedNewItemTypes } from 'src/app/shared/helpers/new-item-types';
import { SearchItemService } from '../../http-services/search-item.service';

@Component({
  selector: 'alg-add-item',
  templateUrl: './add-item.component.html',
  styleUrls: [ './add-item.component.scss' ]
})
export class AddItemComponent implements OnChanges {
  @ViewChild('addContentComponent') addContentComponent?: AddContentComponent<ItemType>;

  @Input() allowSkills = false;
  @Input() addedItemIds: string[] = [];
  @Output() contentAdded = new EventEmitter<AddedContent<ItemType>>();

  allowedNewItemTypes: NewContentType<ItemType>[] = [];

  searchFunction = (value: string): Observable<AddedContent<ItemType>[]> =>
    this.searchItemService.search(value, getAllowedNewItemTypes({allowActivities: true, allowSkills: this.allowSkills}).map(item => item.type));

  constructor(
    private searchItemService: SearchItemService
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {
    this.allowedNewItemTypes = getAllowedNewItemTypes({allowActivities: true, allowSkills: this.allowSkills});
  }

  addChild(item: AddedContent<ItemType>): void {
    this.contentAdded.emit(item);
    this.addContentComponent?.reset();
  }
}
