import { Injectable } from '@angular/core';
import { PerfectScrollbarDirective } from 'ngx-perfect-scrollbar/dist/lib/perfect-scrollbar.directive';

@Injectable({
  providedIn: 'root'
})
export class LeftNavScrollService {

  private scroll?: PerfectScrollbarDirective;

  registerScroll(scroll: PerfectScrollbarDirective): void {
    this.scroll = scroll;
  }

  scrollToMenuItemForId(id: string): void {
    this.scroll?.scrollToElement(`#nav-${ id }`, -8, 300);
  }
}
