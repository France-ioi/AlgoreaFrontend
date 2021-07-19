import { Component } from '@angular/core';
import { AddedContent, NewContentType } from 'src/app/modules/shared-components/components/add-content/add-content.component';
import { GroupCreationService } from '../../http-services/group-creation.service';
import { Router } from '@angular/router';

type GroupType = 'Class'|'Team'|'Club'|'Friends'|'Other'|'Session';

@Component({
  selector: 'alg-add-group',
  templateUrl: 'add-group.component.html',
  styleUrls: [ 'add-group.component.scss' ],
})
export class AddGroupComponent {
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

  constructor(
    private groupCreationService: GroupCreationService,
    private router: Router,
  ) {}

  addChild(group: AddedContent<GroupType>): void {
    this.groupCreationService.create(group.title, group.type).subscribe(createdId => {
      void this.router.navigate([ 'groups', 'by-id', createdId, 'details' ]);
    });
  }
}
