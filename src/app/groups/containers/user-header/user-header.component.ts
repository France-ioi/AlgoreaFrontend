import { Component, input } from '@angular/core';
import { User } from '../../models/user';
import { RawGroupRoute } from 'src/app/models/routing/group-route';
import { UserCaptionPipe } from 'src/app/pipes/userCaption';

@Component({
  selector: 'alg-user-header',
  templateUrl: './user-header.component.html',
  styleUrls: [ './user-header.component.scss' ],
  imports: [
    UserCaptionPipe,
  ]
})
export class UserHeaderComponent {
  user = input.required<User>();
  route = input.required<RawGroupRoute>();

}
