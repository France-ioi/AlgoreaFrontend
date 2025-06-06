import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AddContentComponent,
  AddedContent,
  NewContentType
} from 'src/app/ui-components/add-content/add-content.component';
import { Group } from '../../models/group';
import { SearchGroupService } from '../../data-access/search-group.service';
import { AddContentComponent as AddContentComponent_1 } from 'src/app/ui-components/add-content/add-content.component';
import { SubSectionComponent } from 'src/app/ui-components/sub-section/sub-section.component';

type GroupType = 'Class'|'Team'|'Club'|'Friends'|'Other';

@Component({
  selector: 'alg-add-sub-group',
  templateUrl: './add-sub-group.component.html',
  styleUrls: [ './add-sub-group.component.scss' ],
  standalone: true,
  imports: [ SubSectionComponent, AddContentComponent_1 ]
})
export class AddSubGroupComponent {
  @ViewChild('addContentComponent') addContentComponent?: AddContentComponent<GroupType>;

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
      icon: 'ph-duotone ph-chalkboard-teacher',
      title: $localize`Class`,
      description: '',
    },
    {
      type: 'Club',
      icon: 'ph-duotone ph-address-book',
      title: $localize`Club`,
      description: '',
    },
    {
      type: 'Friends',
      icon: 'ph-duotone ph-users',
      title: $localize`Friends`,
      description: '',
    },
    {
      type: 'Other',
      icon: 'ph-duotone ph-users-three',
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
