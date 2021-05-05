import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

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

  ngOnDestroy(): void {
    this.mode$.complete();
    this.modeActions$.complete();
  }
}
