import { Input, Component } from '@angular/core';
import { User } from '../../models/user';
import { map } from 'rxjs/operators';
import { RawGroupRoute } from 'src/app/models/routing/group-route';
import { UserCaptionPipe } from 'src/app/pipes/userCaption';
import { PageNavigatorComponent } from 'src/app/ui-components/page-navigator/page-navigator.component';
import { NgIf, AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { fromObservation } from 'src/app/store';
import { formatUser } from 'src/app/models/user';

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

  isCurrentGroupObserved$ = this.store.select(fromObservation.selectObservedGroupId).pipe(
    map(observedGroupId => !!(observedGroupId === this.user?.groupId))
  );

  constructor(
    private store: Store,
  ) {}

  onStartWatchButtonClicked(): void {
    this.store.dispatch(fromObservation.userPageActions.enableObservation({
      route: this.route,
      name: formatUser(this.user),
      currentUserCanGrantAccess: this.user.currentUserCanGrantUserAccess || false,
    }));
  }

  onStopWatchButtonClicked(): void {
    this.store.dispatch(fromObservation.userPageActions.disableObservation());
  }
}
