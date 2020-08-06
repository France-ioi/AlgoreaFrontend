import { Component, OnInit, Input } from '@angular/core';
import { ItemNavigationService, MenuItems } from '../../http-services/item-navigation.service';

@Component({
  selector: 'alg-item-nav',
  templateUrl: './item-nav.component.html',
  styleUrls: ['./item-nav.component.scss']
})
export class ItemNavComponent implements OnInit {
  @Input() type: 'activity'|'skill';
  items: 'loading'|'error'|MenuItems = 'loading';

  constructor(
    private itemNavService: ItemNavigationService,
  ) { }

  loadNav(parentItemId: string|null) {
    this.items = 'loading';
    if (parentItemId === null) {
      this.itemNavService.getRootActivities()
        .subscribe(
          (menuItems) => {
            this.items = menuItems;
          },
          (_error) => {
            this.items = 'error';
          }
        );
    }
  }

  ngOnInit() {
    this.loadNav(null);
  }

}
