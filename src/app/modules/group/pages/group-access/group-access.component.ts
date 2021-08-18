import { Component, Input } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';

@Component({
  selector: 'alg-group-access',
  templateUrl: './group-access.component.html',
  styleUrls: [ './group-access.component.scss' ],
})
export class GroupAccessComponent {
  @Input() group?: Group;
}
