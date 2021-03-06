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
  mode$ = new BehaviorSubject<Mode>(Mode.Normal);
  modeActions$ = new Subject<ModeAction>();

  constructor(
    private session: UserSessionService,
  ) {
    this.session.userChanged$.subscribe(() => {
      this.mode$.next(Mode.Normal);
    });
  }

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
