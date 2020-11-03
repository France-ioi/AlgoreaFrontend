import { Component, ViewChild, NgZone, OnDestroy, Input } from '@angular/core';

import { PerfectScrollbarComponent } from 'ngx-perfect-scrollbar';
import { ResizedEvent } from 'angular-resize-event';
import { ContentInfo, CurrentContentService, GroupInfo, isGroupInfo } from 'src/app/shared/services/current-content.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { UserProfile } from 'src/app/shared/http-services/current-user.service';
import { AuthService } from 'src/app/shared/auth/auth.service';

@Component({
  selector: 'alg-navigation-tabs',
  templateUrl: './navigation-tabs.component.html',
  styleUrls: [ './navigation-tabs.component.scss' ]
})
export class NavigationTabsComponent implements OnDestroy {

  @Input() currentUser?: UserProfile;

  @ViewChild('scrollPanel') scrollPanel?: PerfectScrollbarComponent;
  @ViewChild('groupPanel') groupPanel?: HTMLDivElement;

  groupShow = false;
  stickyShow = false;

  private subscription: Subscription; // for cleaning up on destroy

  constructor(
    private currentContentService: CurrentContentService,
    private authService: AuthService,
    private ngZone: NgZone,
  ) {
    this.subscription = this.currentContentService.currentContent$.pipe(
      filter<ContentInfo|null,GroupInfo>(isGroupInfo)
    ).subscribe(_i => this.groupShow = true);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  toggleGroup(): void {
    this.groupShow = !this.groupShow;
    if (!this.groupShow) {
      this.stickyShow = false;
    }
  }

  onResized(e: ResizedEvent): void {
    const directiveRef = this.scrollPanel?.directiveRef;
    if (!directiveRef) return;
    const boundaryHeight = (directiveRef.elementRef.nativeElement as HTMLElement).clientHeight - 50;
    if (e.newHeight > boundaryHeight) {
      // this.stickyShow = true;
      this.updateStatus(directiveRef.elementRef.nativeElement as HTMLElement);
    } else {
      this.stickyShow = false;
    }
  }

  private updateStatus(e: HTMLElement): void {
    this.ngZone.run(() => {
      const scrollTop = e.scrollTop;
      const clientHeight = e.clientHeight - 50;
      const groupHeight = this.groupPanel?.clientHeight || 0;
      if (scrollTop + clientHeight >= groupHeight) {
        this.stickyShow = false;
      } else {
        this.stickyShow = true;
      }
    });
  }

  focusParent(): void {
    if (this.groupPanel) {
      const elements = this.groupPanel.querySelectorAll('.ui-accordion-header a');
      elements.forEach(e => {
        (e as HTMLElement).blur();
      });
      this.groupPanel.focus();
    }
  }

  onScrollEvent(e: {srcElement: HTMLElement}): void { /* guessed type, something cleaner would be nice */
    this.updateStatus(e.srcElement);
  }

  login(): void {
    this.authService.startAuthLogin();
  }
}
