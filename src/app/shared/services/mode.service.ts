import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Group } from 'src/app/modules/group/http-services/get-group-by-id.service';
import { UserSessionService } from './user-session.service';

export enum Mode {
  Normal = 'normal',
  Editing = 'editing',
  Watching = 'watching',
}
export enum ModeAction { StartEditing, StopEditing }

/**
 * "Mode" is a state in which the platform currently is and which is reflected in the header.
 */
@Injectable({
  providedIn: 'root'
})
export class ModeService implements OnDestroy {

  constructor(
    private session: UserSessionService,
  ) {}

  mode$ = new BehaviorSubject<Mode>(Mode.Normal);
  modeActions$ = new Subject<ModeAction>();

  startObserving(group: Group): void {
    this.mode$.next(Mode.Watching);
    this.session.startGroupWatching(group);
  }

  stopObserving(): void {
    this.session.stopGroupWatching();
    this.mode$.next(Mode.Normal);
  }

  ngOnDestroy(): void {
    this.mode$.complete();
    this.modeActions$.complete();
  }
}
