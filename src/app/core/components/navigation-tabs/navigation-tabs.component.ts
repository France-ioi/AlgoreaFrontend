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
  @Output() yourselfSelect = new EventEmitter<any>();
  @Output() groupSelect = new EventEmitter<any>();
  @Output() joinGroupSelect = new EventEmitter<any>();
  @Output() manageGroupSelect = new EventEmitter<any>();

  currentUser;
  groupShow = true;
  stickyShow = false;
  manageShow = false;
  joinShow = false;
  activeTab = 1;
  notified = false;
  selectedGroup = -1;

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

  _focusParent() {
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

  onTabOpen(e) {
    this.selectedGroup = e.index + 1;
    if (e.index === 0) {
      this.manageShow = true;
      this.manageGroupSelect.emit(e);
    } else {
      this.joinShow = true;
      this.joinGroupSelect.emit(e);
    }
    this._focusParent();
  }

  onTabClose(e) {
    this.selectedGroup = e.index + 1;
    if (e.index === 0) {
      this.manageShow = false;
      this.manageGroupSelect.emit(e);
    } else {
      this.joinShow = false;
      this.joinGroupSelect.emit(e);
    }
    this._focusParent();
  }

  onTabChanged(e) {
    this.activeTab = e;
    this.groupShow = false;
    this.stickyShow = false;
  }

  onSelectYourself(e, idx) {
    this.selectedGroup = idx;
    this.fetchUser();
    this.statusService.setUser(this.currentUser);
    this.yourselfSelect.emit(e);
  }

  onSkillSelected(e) {
    this.skillSelect.emit(e);
    this.groupShow = false;
  }

  onActivitySelected(e) {
    this.activitySelect.emit(e);
    this.groupShow = false;
  }

  onNodeChange(e, src) {
    this.currentUser = {
      title: e.title,
      type: 'group'
    };

    this.selectedGroup = 3;

    this.statusService.setUser(this.currentUser);
    this.groupSelect.emit({
      e,
      src
    });
  }

  onTitleChange(e) {
    this.currentUser = {
      title: e.title,
      type: 'group'
    };

    this.selectedGroup = 3;

    this.statusService.setUser(this.currentUser);
  }

  goBack(_e) {
    this.notified = false;
    this.esOb.notified = false;
    this.statusService.setValue(this.esOb);
    this.locationService.back();
  }

  onKeyDown(e) {
    e.preventDefault();

    if (
      e.code !== 'ArrowDown' &&
      e.code !== 'ArrowUp' &&
      e.code !== 'ArrowLeft' &&
      e.code !== 'ArrowRight' &&
      e.code !== 'Space' &&
      e.code !== 'Enter') {
      return;
    }

    // e.stopPropagation();
    if (e.code === 'ArrowUp') {
      this.selectedGroup = (this.selectedGroup - 1 + 3) % 3;
    } else if (e.code === 'ArrowDown') {
      this.selectedGroup = (this.selectedGroup + 1) % 3;
    } else if (e.code === 'Space' || e.code === 'Enter') {
      switch (this.selectedGroup) {
        case 0:
          this.fetchUser();
          this.statusService.setUser(this.currentUser);
          this.yourselfSelect.emit(e);
          break;
        case 1:
          this.manageShow = !this.manageShow;
          this.manageGroupSelect.emit({
            index: 0
          });
          break;
        default:
          this.joinShow = !this.joinShow;
          this.joinGroupSelect.emit({
            index: 1
          });
      }
    } else {
      if (this.selectedGroup === 1) {
        this.manageShow = e.code === 'ArrowRight';
      } else if (this.selectedGroup === 2) {
        this.joinShow = e.code === 'ArrowRight';
      }
    }
  }

}
