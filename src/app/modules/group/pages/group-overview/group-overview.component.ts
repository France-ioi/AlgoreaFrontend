import { Component, Input } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';
import { map } from 'rxjs/operators';
import { UserSessionService } from '../../../../shared/services/user-session.service';

@Component({
  selector: 'alg-group-overview',
  templateUrl: './group-overview.component.html',
  styleUrls: [ './group-overview.component.scss' ],
})
export class GroupOverviewComponent {

  @Input() group?: Group;

  isCurrentGroupWatched$ = this.userSessionService.watchedGroup$.pipe(
    map(watchedGroup => !!(watchedGroup && watchedGroup.id === this.group?.id)),
  );

  constructor(private userSessionService: UserSessionService) {
  }

}
