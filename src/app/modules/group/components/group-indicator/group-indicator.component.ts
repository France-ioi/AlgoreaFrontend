import { Component, Input } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';

@Component({
  selector: 'alg-group-indicator',
  templateUrl: './group-indicator.component.html',
  styleUrls: [ './group-indicator.component.scss' ]
})
export class GroupIndicatorComponent {
  @Input() group?: Group;

  constructor() { }
}
