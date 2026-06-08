import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { User } from '../../models/user';
import { GroupLinksComponent } from '../group-links/group-links.component';


@Component({
  selector: 'alg-user-indicator',
  templateUrl: './user-indicator.component.html',
  styleUrls: [ './user-indicator.component.scss' ],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ GroupLinksComponent ]
})
export class UserIndicatorComponent {
  @Input() user?: User;
}
