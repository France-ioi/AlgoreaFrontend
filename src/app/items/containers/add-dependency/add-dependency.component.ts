import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import {
  AddContentComponent,
  AddedContent,
  NewContentType
} from 'src/app/ui-components/add-content/add-content.component';
import { getAllowedNewItemTypes } from 'src/app/items/models/new-item-types';
import { ItemType } from 'src/app/items/models/item-type';
import { Observable } from 'rxjs';
import { SearchItemService } from 'src/app/data-access/search-item.service';

@Component({
  selector: 'alg-add-dependency',
  templateUrl: './add-dependency.component.html',
  styleUrls: [ './add-dependency.component.scss' ],
  standalone: true,
  imports: [ AddContentComponent ]
})
export class AddDependencyComponent implements OnChanges {
  @ViewChild('addContentComponent') addContentComponent?: AddContentComponent<ItemType>;
  @Input() allowSkills = false;
  @Input() addedIds: string[] = [];
  @Output() contentAdded = new EventEmitter<AddedContent<ItemType>>();

  allowedNewItemTypes: NewContentType<ItemType>[] = [];

  searchFunction = (value: string): Observable<AddedContent<ItemType>[]> =>
    this.searchItemService.search(
      value, getAllowedNewItemTypes({ allowActivities: true, allowSkills: this.allowSkills }).map(item => item.type)
    );

  constructor(
    private searchItemService: SearchItemService
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {
    this.allowedNewItemTypes = getAllowedNewItemTypes({ allowActivities: true, allowSkills: this.allowSkills });
  }

  onAdd(item: AddedContent<ItemType>): void {
    this.contentAdded.emit(item);
  }
}
