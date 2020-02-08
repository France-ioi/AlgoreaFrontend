import { Component, OnInit, Input, OnChanges, SimpleChanges, ViewChild, NgZone, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { EditService } from '../services/edit.service';

@Component({
  selector: 'app-navigation-tabs',
  templateUrl: './navigation-tabs.component.html',
  styleUrls: ['./navigation-tabs.component.scss']
})
export class NavigationTabsComponent implements OnInit, OnChanges {

  @Input() items;

  @ViewChild('scrollPanel', {static: false}) scrollPanel;
  @ViewChild('groupPanel', {static: false}) groupPanel;

  @Output() skillSelect = new EventEmitter<any>();
  @Output() activitySelect = new EventEmitter<any>();
  @Output() yourselfSelect = new EventEmitter<any>();
  @Output() groupSelect = new EventEmitter<any>();

  currentUser;
  groupShow = true;
  stickyShow = false;
  manageShow = false;
  joinShow = false;
  activeTab = 1;

  selectedGroup = -1;

  constructor(
    private ngZone: NgZone,
    private editService: EditService
  ) { }

  ngOnInit() {
  }

  fetchUser(){
    for (const user of this.items.users) {
      if (user.ID === this.items.selectedID) {
        this.currentUser = user;
        break;
      }
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.items) {
      this.fetchUser();
    }
  }

  toggleGroup(e) {
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

  onScrollEvent(e) {
    this._updateStatus(e.srcElement);
  }

  onTabOpen(e) {
    if (e.index === 0) {
      this.manageShow = true;
    } else {
      this.joinShow = true;
    }
    this.selectedGroup = e.index + 1;
  }

  onTabClose(e) {
    if (e.index === 0) {
      this.manageShow = false;
    } else {
      this.joinShow = false;
    }
    this.selectedGroup = e.index + 1;
  }

  onTabChanged(e) {
    this.activeTab = e;
    this.groupShow = false;
    this.stickyShow = false;
  }

  onSelectYourself(e, idx) {
    this.selectedGroup = idx;
    this.fetchUser();
    this.editService.setUser(this.currentUser);
    this.yourselfSelect.emit(e);
  }

  onSkillSelected(e) {
    this.skillSelect.emit(e);
  }

  onActivitySelected(e) {
    this.activitySelect.emit(e);
  }

  onNodeChange(e) {
    this.currentUser = {
      title: e.title,
      type: 'group'
    };
    this.editService.setUser(this.currentUser);
    this.groupSelect.emit(e);
  }

}
