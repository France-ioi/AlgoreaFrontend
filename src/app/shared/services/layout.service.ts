import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

export interface FullFrameContent {
  active: boolean,
  canToggle: boolean,
  animated: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // Service allowing modifications of the layout
  private fullFrameContent = new BehaviorSubject<FullFrameContent>({ active: true, canToggle: false, animated: false });
  /** Expands the content by hiding the left menu and select headers */
  fullFrameContent$ = this.fullFrameContent.pipe(distinctUntilChanged((a, b) => a.active === b.active && a.canToggle === b.canToggle));

  private showTopRightControls = new BehaviorSubject(false);
  readonly showTopRightControls$ = this.showTopRightControls.pipe(distinctUntilChanged());

  private contentFooter = new BehaviorSubject<boolean>(true);
  /**
   * Adds a blank footer to the content area
   * Disabled for instance for displaying a task, as the task iframe is set to fill the screen to the bottom */
  contentFooter$ = this.contentFooter.asObservable();

  private configured = false;

  /**
   * This method allows to defer layout initialization to any consumer, expectedly routes.
   * Only first call in taken into account, later calls are ignored.
   */
  configure({ fullFrameInitiallyActive, showTopRightControls = true, canToggleFullFrameContent = true }: {
    fullFrameInitiallyActive: boolean, // initial fullFrame "enabled" value
    canToggleFullFrameContent?: boolean, // Defines for the lifetime of the app if the left menu can be toggled or not
    showTopRightControls?: boolean, // Defines for the lifetime of the app if the top right controls are shown
  }): void {
    if (this.configured) return;
    this.fullFrameContent.next({ active: fullFrameInitiallyActive, canToggle: canToggleFullFrameContent, animated: false });
    this.showTopRightControls.next(showTopRightControls);
    this.configured = true;
  }

  /** Set fullFrameContent, which expands the content by hiding the left menu and select headers */
  toggleFullFrameContent(active: boolean): void {
    if (!this.configured || !this.fullFrameContent.value.canToggle) return;
    this.fullFrameContent.next({ active, canToggle: true, animated: true });
  }

  /** Set contentFooter, which adds a blank footer to the content side */
  toggleContentFooter(shown: boolean): void {
    this.contentFooter.next(shown);
  }

  toggleTopRightControls(shown: boolean): void {
    this.showTopRightControls.next(shown);
  }
}
