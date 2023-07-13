import { Component, Input } from '@angular/core';
import { GroupData } from '../../services/group-datasource.service';

@Component({
  selector: 'alg-group-header',
  templateUrl: './group-header.component.html',
  styleUrls: [ './group-header.component.scss' ],
})
export class GroupHeaderComponent {
  @Input() groupData?: GroupData;

  constructor() {}
}
