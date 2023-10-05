import { Input, Component } from '@angular/core';
import { User } from '../../http-services/get-user.service';
import { map } from 'rxjs/operators';
import { GroupWatchingService } from 'src/app/core/services/group-watching.service';
import { RawGroupRoute } from 'src/app/shared/routing/group-route';
import { UserCaptionPipe } from '../../../../shared/pipes/userCaption';
import { PageNavigatorComponent } from '../../../shared-components/components/page-navigator/page-navigator.component';
import { NgIf, AsyncPipe } from '@angular/common';

@Component({
  selector: 'alg-user-header[user][route]',
  templateUrl: './user-header.component.html',
  styleUrls: [ './user-header.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    PageNavigatorComponent,
    AsyncPipe,
    UserCaptionPipe,
  ],
})
export class UserHeaderComponent {
  @Input() user!: User;
  @Input() route!: RawGroupRoute;

  isCurrentGroupWatched$ = this.groupWatchingService.watchedGroup$.pipe(
    map(watchedGroup => !!(watchedGroup && watchedGroup.route.id === this.user?.groupId)),
  );

  constructor(
    private groupWatchingService: GroupWatchingService,
  ) {}

  onStartWatchButtonClicked(): void {
    this.groupWatchingService.startUserWatching(this.route, this.user);
  }

  onStopWatchButtonClicked(): void {
    this.groupWatchingService.stopWatching();
  }
}
