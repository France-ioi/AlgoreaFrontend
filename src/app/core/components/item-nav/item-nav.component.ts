import { Component, OnInit, Input } from '@angular/core';
import { ItemNavigationService, MenuItems, Item } from '../../http-services/item-navigation.service';
import { Router } from '@angular/router';
import { Target } from '../item-nav-tree/item-nav-tree.component';

@Component({
  selector: 'alg-item-nav',
  templateUrl: './item-nav.component.html',
  styleUrls: ['./item-nav.component.scss']
})
export class ItemNavComponent implements OnInit {
  @Input() type: 'activity'|'skill';
  items: 'loading'|'error'|MenuItems = 'loading';

  constructor(
    private router: Router,
    private itemNavService: ItemNavigationService,
  ) { }

  navigateTo(target: Target) {
    void this.router.navigate([`/items/details/${target.item.id}/attempt/${target.attemptId}`]);
  }

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
