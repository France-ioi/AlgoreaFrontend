import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { UserSessionService } from './user-session.service';

export enum Mode {
  Normal = 'normal',
  Editing = 'editing',
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

  startEditing(): void {
    this.mode$.next(Mode.Editing);
  }

  stopEditing(): void {
    this.mode$.next(Mode.Normal);
  }

  ngOnDestroy(): void {
    this.mode$.complete();
    this.modeActions$.complete();
  }
}
