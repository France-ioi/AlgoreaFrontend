import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { AddedContent, NewContentType } from '../../../shared-components/components/add-content/add-content.component';
import { getAllowedNewItemTypes } from '../../../../shared/helpers/new-item-types';
import { ItemType } from '../../../../shared/helpers/item-type';
import { Observable } from 'rxjs';
import { SearchItemService } from '../../http-services/search-item.service';

@Component({
  selector: 'alg-add-dependency',
  templateUrl: './add-dependency.component.html',
  styleUrls: [ './add-dependency.component.scss' ]
})
export class AddDependencyComponent implements OnChanges {
  @Input() allowSkills = false;
  @Input() addedIds: string[] = [];
  @Output() contentAdded = new EventEmitter<AddedContent<ItemType>>();

  allowedNewItemTypes: NewContentType<ItemType>[] = [];

  searchFunction = (value: string): Observable<AddedContent<ItemType>[]> =>
    this.searchItemService.search(value, getAllowedNewItemTypes(this.allowSkills).map(item => item.type));

  constructor(
    private searchItemService: SearchItemService
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {
    this.allowedNewItemTypes = getAllowedNewItemTypes(this.allowSkills);
  }

  addDependency(item: AddedContent<ItemType>): void {
    this.contentAdded.emit(item);
  }
}
