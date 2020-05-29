import { Component, OnInit, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import * as _ from 'lodash';
import { GroupService } from '../../shared/services/api/group.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Group, initializeGroup } from '../../shared/models/group.model';

export enum Management {
  None = 'none',
  MembershipsAndGroup = 'memberships_and_group'
}

@Component({
  selector: 'app-group-content',
  templateUrl: './group-content.component.html',
  styleUrls: ['./group-content.component.scss'],
})
export class GroupContentComponent implements OnInit {

  group: Group;
  groupId = 0;

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
        this.router.navigateByUrl(`/groups/${this.groupId}`);
        break;
      case 1:
        this.router.navigateByUrl(`/groups/${this.groupId}/members`);
        break;
      case 2:
        this.router.navigateByUrl(`/groups/${this.groupId}/managers`);
        break;
      case 3:
        this.router.navigateByUrl(`/groups/${this.groupId}/settings`);
        break;
    }
  }
}
