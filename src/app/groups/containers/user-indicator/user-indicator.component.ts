import { Component, Input } from '@angular/core';
import { User } from '../../data-access/get-user.service';
import { GroupLinksComponent } from '../group-links/group-links.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'alg-user-indicator',
  templateUrl: './user-indicator.component.html',
  styleUrls: [ './user-indicator.component.scss' ],
  standalone: true,
  imports: [ NgIf, GroupLinksComponent ]
})
export class UserIndicatorComponent {
  @Input() user?: User;

  constructor() { }
}
