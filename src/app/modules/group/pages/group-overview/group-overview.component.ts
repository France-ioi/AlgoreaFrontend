import { Component, Input } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';

@Component({
  selector: 'alg-group-overview',
  templateUrl: './group-overview.component.html',
  styleUrls: [ './group-overview.component.scss' ],
})
export class GroupOverviewComponent {

  @Input() group?: Group;

}
