import { Component, OnInit, ViewChild, NgZone } from '@angular/core';

import { CurrentUserService } from 'src/app/shared/services/current-user.service';
import { UserProfile } from 'src/app/shared/http-services/current-user.service';
import { Observable } from 'rxjs';
import { PerfectScrollbarComponent } from 'ngx-perfect-scrollbar';
import { ResizedEvent } from 'angular-resize-event';

@Component({
  selector: 'alg-navigation-tabs',
  templateUrl: './navigation-tabs.component.html',
  styleUrls: ['./navigation-tabs.component.scss']
})
export class NavigationTabsComponent implements OnInit {

  @ViewChild('scrollPanel') scrollPanel: PerfectScrollbarComponent;
  @ViewChild('groupPanel') groupPanel: HTMLDivElement;

  groupShow = true;
  stickyShow = false;

  currentUser$: Observable<UserProfile>;

  constructor(
    private currentUserService: CurrentUserService,
    private ngZone: NgZone,
  ) {
  }

  ngOnInit() {
      this.currentUser$ = this.currentUserService.currentUser();
  }

  toggleGroup() {
    this.groupShow = !this.groupShow;
    if (!this.groupShow) {
      this.stickyShow = false;
    }
  }

  onResized(e: ResizedEvent) {
    const boundaryHeight = (this.scrollPanel.directiveRef.elementRef.nativeElement as HTMLElement).clientHeight - 50;
    if (e.newHeight > boundaryHeight) {
      // this.stickyShow = true;
      this._updateStatus(this.scrollPanel.directiveRef.elementRef.nativeElement as HTMLElement);
    } else {
      this.stickyShow = false;
    }
  }

  _updateStatus(e: HTMLElement) {
    this.ngZone.run(() => {
      const scrollTop = e.scrollTop;
      const clientHeight = e.clientHeight - 50;
      const groupHeight = this.groupPanel.clientHeight;
      if (scrollTop + clientHeight >= groupHeight) {
        this.stickyShow = false;
      } else {
        this.stickyShow = true;
      }
    });
  }

  focusParent() {
    const elements = this.groupPanel.querySelectorAll('.ui-accordion-header a');
    elements.forEach((e) => {
      (e as HTMLElement).blur();
    });
    this.groupPanel.focus();
  }

  onScrollEvent(e: {srcElement: HTMLElement}) { /* guessed type, something cleaner would be nice */
    this._updateStatus(e.srcElement);
  }

}
