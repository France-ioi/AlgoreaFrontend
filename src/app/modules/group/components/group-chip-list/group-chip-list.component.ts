import { Component, Input } from '@angular/core';

@Component({
  selector: 'alg-group-chip-list',
  templateUrl: './group-chip-list.component.html',
  styleUrls: [ './group-chip-list.component.scss' ]
})
export class GroupChipListComponent {
  @Input() items: any[] = [];

  readonly hasMoreItems = true;

  constructor() { }

}
