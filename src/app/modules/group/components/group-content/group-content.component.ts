import { Component, OnInit, Input } from '@angular/core';
import { Group } from '../../../../shared/models/group.model';
import { GroupAdministrationComponent } from '../group-administration/group-administration.component';
import { GroupOverviewComponent } from '../group-overview/group-overview.component';
import { GroupCompositionComponent } from '../group-composition/group-composition.component';

interface NavLink {
  path: string;
  label: string;
}

@Component({
  selector: 'alg-group-content',
  templateUrl: './group-content.component.html',
  styleUrls: ['./group-content.component.scss'],
})
export class GroupContentComponent implements OnInit {

  @Input() group: Group;
  activeTab = 0;
  navLinks: NavLink[] = [
    {
      path: './',
      label: 'Overview'
    },
    {
      path: 'members',
      label: 'Composition'
    },
    {
      path: 'managers',
      label: 'Administration'
    },
    {
      path: 'settings',
      label: 'Settings'
    }
  ];

  constructor() { }

  ngOnInit() {
  }

  canShowTab(idx: number) {
    return idx === 0 || idx === 1 || this.group.canMangeMembershipAndGroup();
  }

  canShowTabBar() {
    return this.canShowTab(this.activeTab);
  }

  onRouteActivated(e) {
    if (e instanceof GroupOverviewComponent) {
      this.activeTab = 0;
    } else if (e instanceof GroupCompositionComponent) {
      this.activeTab = 1;
    } else if (e instanceof GroupAdministrationComponent) {
      this.activeTab = 2;
    } else {
      this.activeTab = 3;
    }
  }
}
