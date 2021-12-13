import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface FullFrameContent {
  expanded: boolean,
  canToggle: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // Service allowing modifications of the layout
  private platformAsLTIProvider = location.hash.includes('asLTIProvider');

  private fullFrameContent = new BehaviorSubject<FullFrameContent>(
    this.platformAsLTIProvider
      ? { expanded: true, canToggle: false }
      : { expanded: false, canToggle: true }
  );
  /** Expands the content by hiding the left menu and select headers */
  fullFrameContent$ = this.fullFrameContent.asObservable().pipe(delay(0));

  readonly showTopRightControls = !this.platformAsLTIProvider;

  private contentFooter = new BehaviorSubject<boolean>(true);
  /**
   * Adds a blank footer to the content area
   * Disabled for instance for displaying a task, as the task iframe is set to fill the screen to the bottom */
  contentFooter$ = this.contentFooter.asObservable().pipe(delay(0));

  /** Set fullFrameContent, which expands the content by hiding the left menu and select headers */
  toggleFullFrameContent(expanded: boolean): void {
    if (!this.fullFrameContent.value.canToggle) return;
    this.fullFrameContent.next({ ...this.fullFrameContent.value, expanded });
  }

  /** Set contentFooter, which adds a blank footer to the content side */
  toggleContentFooter(shown: boolean): void {
    this.contentFooter.next(shown);
  }
}
