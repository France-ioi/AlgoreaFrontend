import { Component, input } from '@angular/core';
import { Group } from '../../models/group';
import { GroupLinksComponent } from '../group-links/group-links.component';
import { NgScrollbar } from 'ngx-scrollbar';

@Component({
  selector: 'alg-group-indicator',
  templateUrl: './group-indicator.component.html',
  styleUrls: [ './group-indicator.component.scss' ],
  standalone: true,
  imports: [
    GroupLinksComponent,
    NgScrollbar,
  ]
})
export class GroupIndicatorComponent {
  group = input.required<Group>();
}
