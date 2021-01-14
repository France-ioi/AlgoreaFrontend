import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Subject, timer } from 'rxjs';
import { debounce, map, switchMap, tap } from 'rxjs/operators';
import { Group } from 'src/app/core/components/group-nav-tree/group';
import { AddedContent, NewContentType } from 'src/app/modules/shared-components/components/add-content/add-content.component';
import { SearchGroupService } from '../../http-services/search-group.service';

type GroupType = 'Class'|'Team'|'Club'|'Friends'|'Other';

@Component({
  selector: 'alg-add-sub-group',
  templateUrl: './add-sub-group.component.html',
  styleUrls: [ './add-sub-group.component.scss' ]
})
export class AddSubGroupComponent {

  @Input() group?: Group;

  @Output() addGroup = new EventEmitter<AddedContent<GroupType>>();

  groupsFound: {
    type: GroupType,
    title: string,
    description: string|null,
  }[] = [];

  state: 'loading' | 'ready' = 'loading';

  private dataFetching = new Subject<string>();

  allowedNewGroupTypes: NewContentType<GroupType>[] = [
    {
      type: 'Class',
      icon: 'fa fa-book',
      title: $localize`Class`,
      description: $localize`Class`,
    },
    {
      type: 'Club',
      icon: 'fa fa-book',
      title: $localize`Club`,
      description: $localize`Club`,
    },
    {
      type: 'Friends',
      icon: 'fa fa-users',
      title: $localize`Friends`,
      description: $localize`Friends`,
    },
    {
      type: 'Other',
      icon: 'fa fa-book',
      title: $localize`Other`,
      description: $localize`Other`,
    },
  ];

  constructor(
    private searchGroupService: SearchGroupService,
  ) {
    this.dataFetching.pipe(
      tap(_ => this.state = 'loading'),
      debounce(() => timer(300)),
      switchMap(value => this.searchGroupService.search(value).pipe(map(groups => groups.map(group => ({
        type: group.type,
        title: group.name,
        description: group.description,
      }))))),
    ).subscribe(groups => {
      this.groupsFound = groups;
      this.state = 'ready';
    });
  }

  onSearch(value: string): void {
    this.dataFetching.next(value);
  }

  addChild(group: AddedContent<GroupType>): void {
    this.addGroup.emit(group);
  }
}
