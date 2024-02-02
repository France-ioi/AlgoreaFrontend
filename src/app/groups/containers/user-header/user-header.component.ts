import { Input, Component } from '@angular/core';
import { User } from '../../models/user';
import { RawGroupRoute } from 'src/app/models/routing/group-route';
import { UserCaptionPipe } from 'src/app/pipes/userCaption';
import { PageNavigatorComponent } from 'src/app/ui-components/page-navigator/page-navigator.component';
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

}
