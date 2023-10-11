import { Component, Input } from '@angular/core';
import { GroupData } from '../../services/group-datasource.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'alg-group-header',
  templateUrl: './group-header.component.html',
  styleUrls: [ './group-header.component.scss' ],
  standalone: true,
  imports: [ NgIf ],
})
export class GroupHeaderComponent {
  @Input() groupData?: GroupData;

  constructor() {}
}
