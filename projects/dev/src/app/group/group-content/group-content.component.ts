import { Component, OnInit, ElementRef, Input } from '@angular/core';
import * as _ from 'lodash';
import { ActivatedRoute, Router, UrlSegment } from '@angular/router';
import { Group } from '../../shared/models/group.model';
import { Location } from '@angular/common';

export enum Management {
  None = 'none',
  MembershipsAndGroup = 'memberships_and_group'
}

export enum TabUrls {
  Overview = '',
  Composition = 'members',
  Administration = 'managers',
  Settings = 'settings'
}

@Component({
  selector: 'app-group-content',
  templateUrl: './group-content.component.html',
  styleUrls: ['./group-content.component.scss'],
})
export class GroupContentComponent implements OnInit {

  @Input() group: Group;
  activeTab = 0;

  constructor(
    private activatedRoute: ActivatedRoute,
    private elementRef: ElementRef,
    private router: Router,
    private location: Location) {
  }

  ngOnInit() {
    this.activatedRoute.url.subscribe(() => {
      const path = this.location.path().split('/').pop();
      switch (path) {
        case TabUrls.Composition:
          this.activeTab = 1;
          break;
        case TabUrls.Administration:
          this.activeTab = 2;
          break;
        case TabUrls.Settings:
          this.activeTab = 3;
          break;
        default:
          this.activeTab = 0;
          break;
      }
    });
  }

  canMangeMembershipAndGroup() {
    return this.group.current_user_can_manage === Management.MembershipsAndGroup;
  }

  canShowTab() {
    return this.activeTab === 0 || this.activeTab === 1 || this.canMangeMembershipAndGroup();
  }

  onTabChange() {
    const tabsDom = this.elementRef.nativeElement.querySelectorAll(
      '.mat-tab-labels .mat-tab-label'
    );
    const activeTabDom = this.elementRef.nativeElement.querySelector(
      '.mat-tab-labels .mat-tab-label.mat-tab-label-active'
    );
    tabsDom.forEach((tabDom) => {
      tabDom.classList.remove('mat-tab-label-before-active');
    });

    const iTab = _.findIndex(tabsDom, activeTabDom);
    if (iTab > 0) {
      tabsDom[iTab - 1].classList.add('mat-tab-label-before-active');
    }

    switch (iTab) {
      case 0:
        this.router.navigate([`/dev/groups/${this.group.id}`]);
        break;
      case 1:
        this.router.navigate([`/dev/groups/${this.group.id}/members`]);
        break;
      case 2:
        this.router.navigate([`/dev/groups/${this.group.id}/managers`]);
        break;
      case 3:
        this.router.navigate([`/dev/groups/${this.group.id}/settings`]);
        break;
    }
  }

  onActiveTabChange(idx) {
    this.activeTab = idx;
  }
}
