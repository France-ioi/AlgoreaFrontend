import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // Service allowing modifications of the layout

  private leftMenuAndHeadersDisplayed = new BehaviorSubject<boolean>(true);
  leftMenuAndHeadersDisplayed$ = this.leftMenuAndHeadersDisplayed.asObservable().pipe(delay(0));

  toggleLeftMenuAndHeaders(shown?: boolean): void {
    if (shown !== undefined) {
      this.leftMenuAndHeadersDisplayed.next(shown);
    } else {
      this.leftMenuAndHeadersDisplayed.next(!this.leftMenuAndHeadersDisplayed.value);
    }
  }
}
