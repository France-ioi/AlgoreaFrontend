/* eslint-disable */ /* FIXME disabled for now while this is the mockup code, to be removed afterwards */
import { Component, OnInit, Input, OnChanges, SimpleChanges, ViewChild, NgZone, Output, EventEmitter } from '@angular/core';
import { Location } from '@angular/common';
import { StatusService } from '../../../shared/services/status.service';

@Component({
  selector: 'alg-navigation-tabs',
  templateUrl: './navigation-tabs.component.html',
  styleUrls: ['./navigation-tabs.component.scss']
})
export class NavigationTabsComponent implements OnInit, OnChanges {

  @Input() items;

  @ViewChild('scrollPanel') scrollPanel;
  @ViewChild('groupPanel') groupPanel;

  @Output() skillSelect = new EventEmitter<any>();
  @Output() activitySelect = new EventEmitter<any>();

  currentUser;
  groupShow = true;
  stickyShow = false;
  activeTab = 1;
  notified = false;

  esOb;

  constructor(
    private ngZone: NgZone,
    private statusService: StatusService,
    private locationService: Location,
  ) {
  }

  ngOnInit() {
    this.statusService.getObservable().subscribe(res => {
      this.notified = res.notified;
      this.esOb = res;
    });
  }

  fetchUser() {
    for (const user of this.items.users) {
      if (user.ID === this.items.selectedID) {
        this.currentUser = user;
        break;
      }
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('navigation tabs', changes);
    if (this.items) {
      this.fetchUser();
    }
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
    this.activeTab = e;
    this.groupShow = false;
    this.stickyShow = false;
  }

  onSkillSelected(e) {
    this.skillSelect.emit(e);
    this.groupShow = false;
  }

  onActivitySelected(e) {
    this.activitySelect.emit(e);
    this.groupShow = false;
  }

  goBack(_e) {
    this.notified = false;
    this.esOb.notified = false;
    this.statusService.setValue(this.esOb);
    this.locationService.back();
  }

}
