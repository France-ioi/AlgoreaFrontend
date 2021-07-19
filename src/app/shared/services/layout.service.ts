import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // Service allowing modifications of the layout

  private fullFrameContent = new BehaviorSubject<boolean>(true);
  fullFrameContent$ = this.fullFrameContent.asObservable().pipe(delay(0));

  private footer = new BehaviorSubject<boolean>(false);
  footer$ = this.footer.asObservable().pipe(delay(0));

  toggleFullFrameContent(shown: boolean): void {
    this.fullFrameContent.next(shown);
  }

  toggleWithFooter(shown: boolean): void {
    this.footer.next(shown);
  }
}
