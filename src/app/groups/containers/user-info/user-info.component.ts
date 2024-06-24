import { Component, Input } from '@angular/core';
import { User } from 'src/app/groups/models/user';

@Component({
  selector: 'alg-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: [ './user-info.component.scss' ],
  standalone: true,
})
export class UserInfoComponent {
  @Input({ required: true }) user!: User;
}
