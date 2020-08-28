/* eslint-disable */ /* FIXME disabled for now while this is the mockup code, to be removed afterwards */
import { Component, OnInit, Input, OnChanges, SimpleChanges, ViewChild, NgZone, Output, EventEmitter } from '@angular/core';
import { Location } from '@angular/common';
import { StatusService } from '../../../shared/services/status.service';
import { CurrentUserService } from 'src/app/shared/services/current-user.service';
import { UserProfile } from 'src/app/shared/http-services/current-user.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'alg-navigation-tabs',
  templateUrl: './navigation-tabs.component.html',
  styleUrls: ['./navigation-tabs.component.scss']
})
export class NavigationTabsComponent implements OnInit {

  @ViewChild('scrollPanel') scrollPanel;
  @ViewChild('groupPanel') groupPanel;

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

  toggleGroup(_e) {
    this.groupShow = !this.groupShow;
    if (!this.groupShow) {
      this.stickyShow = false;
    }
  }

  onResized(e) {
    const boundaryHeight = this.scrollPanel.directiveRef.elementRef.nativeElement.clientHeight - 50;
    if (e.newHeight > boundaryHeight) {
      // this.stickyShow = true;
      this._updateStatus(this.scrollPanel.directiveRef.elementRef.nativeElement);
    } else {
      this.stickyShow = false;
    }
  }

  _updateStatus(e) {
    this.ngZone.run(() => {
      const scrollTop = e.scrollTop;
      const clientHeight = e.clientHeight - 50;
      const groupHeight = this.groupPanel.nativeElement.clientHeight;
      if (scrollTop + clientHeight >= groupHeight) {
        this.stickyShow = false;
      } else {
        this.stickyShow = true;
      }
    });
  }

  focusParent() {
    const elements = this.groupPanel.nativeElement.querySelectorAll('.ui-accordion-header a');
    console.log(elements);
    for (const element of elements) {
      (element as HTMLElement).blur();
    }
    (this.groupPanel.nativeElement as HTMLElement).focus();
  }

  onScrollEvent(e) {
    this._updateStatus(e.srcElement);
  }

  onTabChanged(e) {
    this.groupShow = false;
    this.stickyShow = false;
  }

}
