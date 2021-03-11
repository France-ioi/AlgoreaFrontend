import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AddedContent, NewContentType } from 'src/app/modules/shared-components/components/add-content/add-content.component';
import { Group } from '../../http-services/get-group-by-id.service';
import { SearchGroupService } from '../../http-services/search-group.service';

type GroupType = 'Class'|'Team'|'Club'|'Friends'|'Other';

@Component({
  selector: 'alg-add-sub-group',
  templateUrl: './add-sub-group.component.html',
  styleUrls: [ './add-sub-group.component.scss' ]
})
export class AddSubGroupComponent {

  @Input() group?: Group;
  @Input() loading = false;

  @Output() addGroup = new EventEmitter<AddedContent<GroupType>>();

  groupsFound: {
    type: GroupType,
    title: string,
    description: string|null,
  }[] = [];

  allowedNewGroupTypes: NewContentType<GroupType>[] = [
    {
      type: 'Class',
      icon: 'fa fa-book',
      title: $localize`Class`,
      description: '',
    },
    {
      type: 'Club',
      icon: 'fa fa-book',
      title: $localize`Club`,
      description: '',
    },
    {
      type: 'Friends',
      icon: 'fa fa-users',
      title: $localize`Friends`,
      description: '',
    },
    {
      type: 'Other',
      icon: 'fa fa-book',
      title: $localize`Other`,
      description: '',
    },
  ];

  searchFunction = (value: string): Observable<AddedContent<GroupType>[]> =>
    this.searchGroupService.searchPossibleSubgroups(value).pipe(map(groups => groups.map(group => ({
      id: group.id,
      type: group.type,
      title: group.name,
      description: group.description,
    }))));

  constructor(
    private searchGroupService: SearchGroupService,
  ) {}

  addChild(group: AddedContent<GroupType>): void {
    this.addGroup.emit(group);
  }
}
