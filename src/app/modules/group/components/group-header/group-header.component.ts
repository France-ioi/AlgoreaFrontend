import { Component, Input } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';

@Component({
  selector: 'alg-group-header',
  templateUrl: './group-header.component.html',
  styleUrls: ['./group-header.component.scss'],
})
export class GroupHeaderComponent  {
  @Input() group?: Group;
}
