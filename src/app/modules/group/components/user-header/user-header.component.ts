import { Input, Component } from '@angular/core';
import { User } from '../../http-services/get-user.service';
import { map } from 'rxjs/operators';
import { ModeAction, ModeService } from '../../../../shared/services/mode.service';
import { GroupWatchingService } from 'src/app/core/services/group-watching.service';
import { RawGroupRoute } from 'src/app/shared/routing/group-route';

@Component({
  selector: 'alg-user-header[user][route]',
  templateUrl: './user-header.component.html',
  styleUrls: [ './user-header.component.scss' ],
})
export class UserHeaderComponent {
  @Input() user!: User;
  @Input() route!: RawGroupRoute;

  isCurrentGroupWatched$ = this.groupWatchingService.watchedGroup$.pipe(
    map(watchedGroup => !!(watchedGroup && watchedGroup.route.id === this.user?.groupId)),
  );

  constructor(
    private groupWatchingService: GroupWatchingService,
    private modeService: ModeService,
  ) {
  }

  onEditButtonClicked(): void {
    this.modeService.modeActions$.next(ModeAction.StartEditing);
  }

  onStartWatchButtonClicked(): void {
    this.groupWatchingService.startUserWatching(this.route, this.user);
  }

  onStopWatchButtonClicked(): void {
    this.groupWatchingService.stopWatching();
  }
}
