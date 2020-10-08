import { Component, Output, EventEmitter } from '@angular/core';
import { JoinedGroupsService } from '../../http-services/joined-groups.service';
import { ManagedGroupsService } from '../../http-services/managed-groups.service';
import { Group } from '../group-nav-tree/group';
import { of, merge } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

const joinGroupTabIdx = 1;

type GroupData = 'loading'|'error'|Group[];

@Component({
  selector: 'alg-group-nav',
  templateUrl: './group-nav.component.html',
  styleUrls: ['./group-nav.component.scss']
})
export class GroupNavComponent {

  @Output() focusOnGroupNav = new EventEmitter<void>();

  joinedGroups: GroupData = [];
  managedGroups: GroupData = [];
  selectedGroup: number;

  constructor(
    private joinedGroupsService: JoinedGroupsService,
    private managedGroupService: ManagedGroupsService,
    private router: Router,
  ) { }

  onTabOpen(event: {index: number}) {
    this.focusOnGroupNav.emit();
    const service = event.index == joinGroupTabIdx ?
      this.joinedGroupsService.getJoinedGroups() : this.managedGroupService.getManagedGroups();
    merge(
      of<GroupData>('loading'),
      service.pipe(
        catchError(_e => of<GroupData>('error'))
      )
    ).subscribe(res => {
      if (event.index == joinGroupTabIdx) this.joinedGroups = res;
      else this.managedGroups = res;
    });
  }

  onSelectYourself() {
    this.selectedGroup = 0;
    void this.router.navigate(['yourself']);
  }
}
