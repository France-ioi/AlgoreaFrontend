import { Component, ViewChild, NgZone, OnDestroy, Input, ElementRef, OnInit } from '@angular/core';

import { PerfectScrollbarComponent } from 'ngx-perfect-scrollbar';
import { ContentInfo, CurrentContentService, GroupInfo, isGroupInfo } from 'src/app/shared/services/current-content.service';
import { debounceTime, filter } from 'rxjs/operators';
import { fromEvent, Subscription } from 'rxjs';
import { UserSession, UserSessionService } from 'src/app/shared/services/user-session.service';
import { AuthService } from 'src/app/shared/auth/auth.service';

@Component({
  selector: 'alg-navigation-tabs',
  templateUrl: './navigation-tabs.component.html',
  styleUrls: [ './navigation-tabs.component.scss' ]
})
export class NavigationTabsComponent implements OnInit, OnDestroy {

  @Input() session?: UserSession;

  @ViewChild('scrollPanel') scrollPanel?: PerfectScrollbarComponent;
  @ViewChild('groupPanel') groupPanel?: ElementRef<HTMLDivElement>;

  groupShow = false;
  stickyShow = false;

  private subscription: Subscription; // for cleaning up on destroy
  private resizeSubscription?: Subscription

  constructor(
    private currentContentService: CurrentContentService,
    private userSessionService: UserSessionService,
    private authService: AuthService,
    private ngZone: NgZone,
  ) {
    this.subscription = this.currentContentService.currentContent$.pipe(
      filter<ContentInfo|null,GroupInfo>(isGroupInfo)
    ).subscribe(_i => this.groupShow = true);
  }

  ngOnInit(): void {
    this.resizeSubscription = fromEvent(window, 'resize').pipe(debounceTime(200)).subscribe(() => this.onResize());
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.resizeSubscription?.unsubscribe();
  }

  toggleGroup(): void {
    this.groupShow = !this.groupShow;
    if (!this.groupShow) {
      this.stickyShow = false;
    }
  }

  private onResize(): void {
    const directiveRef = this.scrollPanel?.directiveRef;
    if (!directiveRef || !this.groupPanel) return;
    const boundaryHeight = (directiveRef.elementRef.nativeElement as HTMLElement).clientHeight - 50;
    if (this.groupPanel.nativeElement.clientHeight > boundaryHeight) {
      this.updateStatus(directiveRef.elementRef.nativeElement as HTMLElement);
    } else {
      this.stickyShow = false;
    }
  }

  private updateStatus(e: HTMLElement): void {
    this.ngZone.run(() => {
      const scrollTop = e.scrollTop;
      const clientHeight = e.clientHeight - 50;
      const groupHeight = this.groupPanel?.nativeElement.clientHeight || 0;
      this.stickyShow = scrollTop + clientHeight < groupHeight;
    });
  }

  focusParent(): void {
    if (this.groupPanel) {
      const elements = this.groupPanel.nativeElement.querySelectorAll('.p-accordion-header a');
      elements.forEach(e => {
        (e as HTMLElement).blur();
      });
      this.groupPanel.nativeElement.focus();
    }
  }

  onScrollEvent(e: {srcElement: HTMLElement}): void { /* guessed type, something cleaner would be nice */
    this.updateStatus(e.srcElement);
  }

  onStopWatchPressed(): void {
    this.userSessionService.stopGroupWatching();
  }

  login(): void {
    this.authService.startAuthLogin();
  }
}
