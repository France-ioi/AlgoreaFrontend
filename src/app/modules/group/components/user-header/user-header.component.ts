import { Input, Component } from '@angular/core';
import { User } from '../../http-services/get-user.service';
import { map } from 'rxjs/operators';
import { UserSessionService } from '../../../../shared/services/user-session.service';
import { ModeAction, ModeService } from '../../../../shared/services/mode.service';
import { formatUser } from '../../../../shared/helpers/user';

@Component({
  selector: 'alg-user-header',
  templateUrl: './user-header.component.html',
  styleUrls: [ './user-header.component.scss' ],
})
export class UserHeaderComponent {
  @Input() user?: User;

  isCurrentGroupWatched$ = this.userSessionService.watchedGroup$.pipe(
    map(watchedGroup => !!(watchedGroup && watchedGroup.id === this.user?.groupId)),
  );

  constructor(
    private userSessionService: UserSessionService,
    private modeService: ModeService,
  ) {
  }

  onEditButtonClicked(): void {
    this.modeService.modeActions$.next(ModeAction.StartEditing);
  }

  onStartWatchButtonClicked(): void {
    if (!this.user) throw new Error("unexpected user not set in 'onWatchButtonClicked'");
    this.modeService.startObserving({
      id: this.user.groupId,
      name: formatUser(this.user),
      login: this.user.login,
    });
  }

  onStopWatchButtonClicked(): void {
    this.modeService.stopObserving();
  }
}
