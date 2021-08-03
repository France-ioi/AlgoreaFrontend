import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ContentInfo } from '../models/content/content-info';

/**
 * Service for tracking what is current displayed in the content (right) pane.
 * This component does not change the content but is used to broadcast the information to those
 * which wants to be informed.
 */
@Injectable({
  providedIn: 'root'
})
export class CurrentContentService implements OnDestroy {

  private content = new BehaviorSubject<ContentInfo|null>(null);
  currentContent$ = this.content.asObservable();

  /**
   * The current content
   */
  current(): ContentInfo|null {
    return this.content.value;
  }

  /**
   * Replace the current content by the given content.
   */
  replace(content: ContentInfo): void {
    this.content.next(content);
  }

  /**
   * Clear the current content. Typically called when leave a component which displays a content.
   */
  clear(): void {
    this.content.next(null);
  }

  ngOnDestroy(): void {
    this.content.complete();
  }
}
