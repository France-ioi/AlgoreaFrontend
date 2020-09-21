import { Injectable } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';
import { Group } from '../http-services/get-group-by-id.service';

/**
 * A service to pass information between the parent page (e.g. group detail) and its tabs.
 * In particular:
 * - it lets the parent pass the current displayed group
 * - it lets the tab pages ask for a group info refresh
 */
@Injectable()
export class GroupTabService {
  // for parent to pass the current group to tabs
  private group = new ReplaySubject<Group>(1);

  // for tabs to ask for a group refresh
  private refresh = new Subject<void>();

  readonly group$ = this.group.asObservable();
  readonly refresh$ = this.refresh.asObservable();

  setGroup(g: Group) {
    this.group.next(g);
  }

  requestGroupRefresh() {
    this.refresh.next();
  }
}
