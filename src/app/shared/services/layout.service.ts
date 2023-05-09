import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

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

  private initialized = false;

  /** Expands the content by hiding the left menu and select headers */
  private fullFrame = new BehaviorSubject<FullFrameContent>({ active: true, canToggle: false, animated: false });
  fullFrame$ = this.fullFrame.pipe(distinctUntilChanged((a, b) => a.active === b.active && a.canToggle === b.canToggle), shareReplay(1));

  private showTopRightControls = new BehaviorSubject(false);
  showTopRightControls$ = this.showTopRightControls.pipe(distinctUntilChanged());

  /**
   * Configure layout, expectedly called by routes.
   */
  configure({ fullFrameActive, showTopRightControls, canToggleFullFrame }: {
    fullFrameActive: boolean,
    canToggleFullFrame?: boolean,
    showTopRightControls?: boolean,
  }): void {
    const canToggleFallback = !this.initialized || this.fullFrame.value.canToggle;
    const canToggle = canToggleFullFrame ?? canToggleFallback;
    this.fullFrame.next({
      canToggle,
      active: canToggle ? fullFrameActive : this.fullFrame.value.active,
      animated: this.initialized,
    });


    if (showTopRightControls !== undefined) this.showTopRightControls.next(showTopRightControls);
    else if (!this.initialized) this.showTopRightControls.next(true);

    if (!this.initialized) this.initialized = true;
  }

}
