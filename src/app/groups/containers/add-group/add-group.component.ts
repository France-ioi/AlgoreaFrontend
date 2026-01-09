import { Component } from '@angular/core';
import { AddedContent, NewContentType } from 'src/app/ui-components/add-content/add-content.component';
import { GroupCreationService } from '../../data-access/group-creation.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { GroupRouter } from 'src/app/models/routing/group-router';
import { rawGroupRoute } from 'src/app/models/routing/group-route';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { AddContentComponent } from 'src/app/ui-components/add-content/add-content.component';

type GroupType = 'Class'|'Team'|'Club'|'Friends'|'Other'|'Session';

@Component({
  selector: 'alg-add-group',
  templateUrl: 'add-group.component.html',
  styleUrls: [ 'add-group.component.scss' ],
  imports: [ AddContentComponent ]
})
export class AddGroupComponent {
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

  state: 'addingGroup' | 'ready' = 'ready';

  constructor(
    private groupCreationService: GroupCreationService,
    private actionFeedbackService: ActionFeedbackService,
    private groupRouter: GroupRouter,
    private currentContentService: CurrentContentService,
  ) {}

  addChild(group: AddedContent<GroupType>): void {
    this.state = 'addingGroup';
    this.groupCreationService.create(group.title, group.type).subscribe({
      next: createdId => {
        this.state = 'ready';
        this.actionFeedbackService.success($localize`Group successfully created`);
        this.currentContentService.forceNavMenuReload();
        this.groupRouter.navigateTo(rawGroupRoute({ ...group, id: createdId }));
      },
      error: err => {
        this.state = 'ready';
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      }
    });
  }
}
