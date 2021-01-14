import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Observable } from 'rxjs';
import { NewContentType, AddedContent } from 'src/app/modules/shared-components/components/add-content/add-content.component';
import { ItemType } from 'src/app/shared/helpers/item-type';
import { ItemFound, SearchItemService } from '../../http-services/search-item.service';

const allowedNewItemTypes: NewContentType<ItemType>[] = [
  {
    type: 'Chapter',
    icon: 'fa fa-book',
    title: $localize`Chapter`,
    description: $localize`A new folder which can contain any activities.`,
  },
  {
    type: 'Task',
    icon: 'fa fa-code',
    title: $localize`Task`,
    description: $localize`A new task which users can try to solve.`,
  },
  {
    type: 'Skill',
    icon: 'fa fa-graduation-cap',
    title: $localize`Skill'`,
    description: $localize`A new sub-skill.`,
  },
];

@Component({
  selector: 'alg-add-item',
  templateUrl: './add-item.component.html',
  styleUrls: [ './add-item.component.scss' ]
})
export class AddItemComponent implements OnChanges {

  @Input() allowSkills = false;
  @Output() contentAdded = new EventEmitter<AddedContent<ItemType>>();

  allowedNewItemTypes: NewContentType<ItemType>[] = [];
  itemsFound: ItemFound[] = [];
  state: 'loading' | 'ready' = 'loading';

  searchFunction = (value: string): Observable<AddedContent<ItemType>[]> =>
    this.searchItemService.search(value, [ 'Chapter', 'Course', 'Task' ]);

  constructor(
    private searchItemService: SearchItemService
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {
    this.allowedNewItemTypes = this.allowSkills ? allowedNewItemTypes : allowedNewItemTypes.slice(0, -1);
  }

  addChild(item: AddedContent<ItemType>): void {
    this.contentAdded.emit(item);
  }
}
