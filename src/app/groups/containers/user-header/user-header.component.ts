import { Input, Component } from '@angular/core';
import { User } from '../../models/user';
import { RawGroupRoute } from 'src/app/models/routing/group-route';
import { UserCaptionPipe } from 'src/app/pipes/userCaption';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'alg-user-header[user][route]',
  templateUrl: './user-header.component.html',
  styleUrls: [ './user-header.component.scss' ],
  imports: [
    UserCaptionPipe,
  ]
})
export class UserHeaderComponent {
  @Input() user!: User;
  @Input() route!: RawGroupRoute;

}
