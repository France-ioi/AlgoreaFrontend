import { Injectable, OnDestroy } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';
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

  private content = new ReplaySubject<ContentInfo | null>(1);
  content$ = this.content.asObservable();

  private navMenuReload = new Subject<void>();
  navMenuReload$ = this.navMenuReload.asObservable();

  /**
   * Replace the current content by the given content.
   */
  replace(content: ContentInfo): void {
    this.content.next(content);
  }

  /**
   * Order the nav menu to full reload. To be used when more than the current content has changed.
   */
  forceNavMenuReload(): void {
    this.navMenuReload.next();
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
