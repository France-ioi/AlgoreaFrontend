import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Subject, timer } from 'rxjs';
import { debounce, switchMap, tap } from 'rxjs/operators';
import { NewContentType, AddedContent } from 'src/app/modules/shared-components/components/add-content/add-content.component';
import { ItemType } from 'src/app/shared/helpers/item-type';
import { ItemFound, SearchItemService } from '../../http-services/search-item.service';

const newItemTypes: NewContentType<ItemType>[] = [
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

  newItemTypes: NewContentType<ItemType>[] = [];
  itemsFound: ItemFound[] = [];
  state: 'loading' | 'ready' = 'loading';

  private dataFetching = new Subject<string>();

  constructor(
    private searchItemService: SearchItemService
  ) {
    this.dataFetching.pipe(
      tap(_ => this.state = 'loading'),
      debounce(() => timer(300)),
      switchMap(value => this.searchItemService.search(value, [ 'Chapter', 'Course', 'Task' ])),
    ).subscribe(items => {
      this.itemsFound = items;
      this.state = 'ready';
    });
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.newItemTypes = this.allowSkills ? newItemTypes : newItemTypes.slice(0, -1);
  }

  onSearch(value: string): void {
    this.dataFetching.next(value);
  }

  addChild(item: AddedContent<ItemType>): void {
    this.contentAdded.emit(item);
  }
}
