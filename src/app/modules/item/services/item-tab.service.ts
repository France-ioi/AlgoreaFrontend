import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { Item } from '../http-services/get-item-by-id.service';

/**
 * A service to pass information between the parent page (e.g. item detail) and its tabs.
 */
@Injectable()
export class ItemTabService {
  // for parent to pass the current item to tabs
  private item = new ReplaySubject<Item>(1);

  readonly item$ = this.item.asObservable();

  setItem(i: Item) {
    this.item.next(i);
  }

}
