import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

export interface FullFrameContent {
  expanded: boolean,
  canToggle: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // Service allowing modifications of the layout
  private fullFrameContent = new BehaviorSubject<FullFrameContent>({ expanded: false, canToggle: true });
  /** Expands the content by hiding the left menu and select headers */
  fullFrameContent$ = this.fullFrameContent.pipe(distinctUntilChanged((a, b) => a.expanded === b.expanded && a.canToggle === b.canToggle));

  private showTopRightControls = new BehaviorSubject(true);
  readonly showTopRightControls$ = this.showTopRightControls.pipe(distinctUntilChanged());

  private contentFooter = new BehaviorSubject<boolean>(true);
  /**
   * Adds a blank footer to the content area
   * Disabled for instance for displaying a task, as the task iframe is set to fill the screen to the bottom */
  contentFooter$ = this.contentFooter.asObservable();

  /** Set fullFrameContent, which expands the content by hiding the left menu and select headers */
  toggleFullFrameContent(expanded: boolean, canToggle = this.fullFrameContent.value.canToggle): void {
    if (!this.fullFrameContent.value.canToggle) return;
    this.fullFrameContent.next({ expanded, canToggle });
  }

  /** Set contentFooter, which adds a blank footer to the content side */
  toggleContentFooter(shown: boolean): void {
    this.contentFooter.next(shown);
  }

  toggleTopRightControls(shown: boolean): void {
    this.showTopRightControls.next(shown);
  }
}
