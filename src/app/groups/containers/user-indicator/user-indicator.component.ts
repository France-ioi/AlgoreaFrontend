import { Component, input } from '@angular/core';
import { User } from '../../models/user';
import { GroupLinksComponent } from '../group-links/group-links.component';


@Component({
  selector: 'alg-user-indicator',
  templateUrl: './user-indicator.component.html',
  styleUrl: './user-indicator.component.scss',
  imports: [ GroupLinksComponent ]
})
export class UserIndicatorComponent {
  user = input.required<User>();
}
