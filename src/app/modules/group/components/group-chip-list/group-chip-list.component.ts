import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { GroupShortInfo } from '../../http-services/get-group-by-id.service';

@Component({
  selector: 'alg-group-chip-list',
  templateUrl: './group-chip-list.component.html',
  styleUrls: [ './group-chip-list.component.scss' ]
})
export class GroupChipListComponent {
  @Input() items: GroupShortInfo[] = [];

  get hasMoreItems(): boolean {
    return this.items.length > 3;
  }

  get moreItemsCount(): number {
    return this.items.length - 3;
  }

  constructor(private router: Router) { }

  onButtonClick(item: GroupShortInfo): void {
    void this.router.navigate([ 'groups', 'by-id', item.id, 'details' ]);
  }

}
