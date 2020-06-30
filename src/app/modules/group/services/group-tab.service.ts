import { Injectable } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';
import { Group } from '../http-services/get-group-by-id.service';

@Injectable()
export class GroupTabService {
  // for parent to pass the current group to tabs
  group$ = new ReplaySubject<Group>(1);
  // for tabs to ask for a group refresh
  refresh$ = new Subject<void>();
}
