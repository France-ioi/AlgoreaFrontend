import { Component } from '@angular/core';
import { AddedContent, NewContentType } from 'src/app/modules/shared-components/components/add-content/add-content.component';
import { GroupCreationService } from '../../http-services/group-creation.service';
import { Router } from '@angular/router';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';

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

  state: 'addingGroup' | 'ready' = 'ready';

  constructor(
    private groupCreationService: GroupCreationService,
    private actionFeedbackService: ActionFeedbackService,
    private router: Router,
  ) {}

  addChild(group: AddedContent<GroupType>): void {
    this.state = 'addingGroup';
    this.groupCreationService.create(group.title, group.type).subscribe({
      next: createdId => {
        this.state = 'ready';
        void this.router.navigate([ 'groups', 'by-id', createdId, 'details' ]);
      },
      error: () => {
        this.state = 'ready';
        this.actionFeedbackService.unexpectedError();
      }
    });
  }
}
