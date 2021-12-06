import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { delay, distinctUntilChanged, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // Service allowing modifications of the layout
  private platformAsLTIProvider = location.hash.includes('asLTIProvider');
  readonly hideLeftMenu = this.platformAsLTIProvider;

  private fullFrameContent = new BehaviorSubject<boolean>(false);
  /** Expands the content by hiding the left menu and select headers */
  fullFrameContent$ = this.fullFrameContent.asObservable().pipe(
    delay(0),
    map(fullFrame => this.hideLeftMenu || fullFrame),
    distinctUntilChanged(),
  );

  private contentFooter = new BehaviorSubject<boolean>(true);
  /**
   * Adds a blank footer to the content area
   * Disabled for instance for displaying a task, as the task iframe is set to fill the screen to the bottom */
  contentFooter$ = this.contentFooter.asObservable().pipe(delay(0));

  /** Set fullFrameContent, which expands the content by hiding the left menu and select headers */
  toggleFullFrameContent(shown: boolean): void {
    this.fullFrameContent.next(shown);
  }

  /** Set contentFooter, which adds a blank footer to the content side */
  toggleContentFooter(shown: boolean): void {
    this.contentFooter.next(shown);
  }
}
