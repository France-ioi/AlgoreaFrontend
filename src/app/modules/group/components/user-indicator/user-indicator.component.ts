import { Component, Input } from '@angular/core';
import { User } from '../../http-services/get-user.service';

@Component({
  selector: 'alg-user-indicator',
  templateUrl: './user-indicator.component.html',
  styleUrls: [ './user-indicator.component.scss' ]
})
export class UserIndicatorComponent {
  @Input() user?: User;

  constructor() { }
}
