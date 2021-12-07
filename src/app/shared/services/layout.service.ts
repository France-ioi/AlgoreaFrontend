import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { delay } from 'rxjs/operators';
import { LTIService } from 'src/app/core/services/lti.service';

export interface FullFrameContent {
  expanded: boolean,
  canToggle: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // Service allowing modifications of the layout
  private fullFrameContent = new BehaviorSubject<FullFrameContent>(
    this.ltiService.isProvider
      ? { expanded: true, canToggle: false }
      : { expanded: false, canToggle: true }
  );
  /** Expands the content by hiding the left menu and select headers */
  fullFrameContent$ = this.fullFrameContent.asObservable().pipe(delay(0));

  readonly showTopRightControls = !this.ltiService.isProvider;

  private contentFooter = new BehaviorSubject<boolean>(true);
  /**
   * Adds a blank footer to the content area
   * Disabled for instance for displaying a task, as the task iframe is set to fill the screen to the bottom */
  contentFooter$ = this.contentFooter.asObservable().pipe(delay(0));

  constructor(
    private ltiService: LTIService,
  ) {}

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
