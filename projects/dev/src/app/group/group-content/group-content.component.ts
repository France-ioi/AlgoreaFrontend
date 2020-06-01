import { Component, OnInit, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import * as _ from 'lodash';
import { GroupService } from '../../shared/services/api/group.service';
import { ActivatedRoute, Router, UrlSegment } from '@angular/router';
import { Group, initializeGroup } from '../../shared/models/group.model';

export enum Management {
  None = 'none',
  MembershipsAndGroup = 'memberships_and_group'
}

export enum TabUrls {
  Overview = 'overview',
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

  group: Group;
  groupId = 0;
  activeTab = 0;

  constructor(
    private activatedRoute: ActivatedRoute,
    private elementRef: ElementRef,
    private groupService: GroupService,
    private router: Router) {
    this.group = initializeGroup();
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe((routeParams) => {
      this.groupId = routeParams.id;
      this.groupService.getGroup(this.groupId).subscribe((group) => {
        this.group = group;
      });
    });

    this.activatedRoute.url.subscribe((segments: UrlSegment[]) => {
      switch (segments[0].path) {
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

  // tslint:disable-next-line
  onTabChange(_e) {
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
        this.router.navigate([`/dev/groups/${this.groupId}`]);
        break;
      case 1:
        this.router.navigate([`/dev/groups/${this.groupId}/members`]);
        break;
      case 2:
        this.router.navigate([`/dev/groups/${this.groupId}/managers`]);
        break;
      case 3:
        this.router.navigate([`/dev/groups/${this.groupId}/settings`]);
        break;
    }
  }
}
