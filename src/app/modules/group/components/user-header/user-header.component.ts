import { Input, Component } from '@angular/core';
import { User } from '../../http-services/get-user.service';
import { map } from 'rxjs/operators';
import { ModeAction, ModeService } from '../../../../shared/services/mode.service';
import { GroupWatchingService } from 'src/app/core/services/group-watching.service';

@Component({
  selector: 'alg-user-header',
  templateUrl: './user-header.component.html',
  styleUrls: [ './user-header.component.scss' ],
})
export class UserHeaderComponent {
  @Input() user?: User;

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
    if (!this.user) throw new Error("unexpected user not set in 'onWatchButtonClicked'");
    this.groupWatchingService.startUserWatching(this.user);
  }

  onStopWatchButtonClicked(): void {
    this.groupWatchingService.stopWatching();
  }
}
