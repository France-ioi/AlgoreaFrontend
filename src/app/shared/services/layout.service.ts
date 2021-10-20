import { Injectable } from '@angular/core';
import { BehaviorSubject, of, Subject, timer } from 'rxjs';
import { delay, distinctUntilChanged, mapTo, shareReplay, startWith, switchMap } from 'rxjs/operators';
import { HOURS } from '../helpers/duration';

const delayUntilReactivateAutoToggle = 2*HOURS;

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // Service allowing modifications of the layout

  private toggledManually$ = new Subject<boolean>();
  private fullFrameContent = new BehaviorSubject<boolean>(false);
  /** Expands the content by hiding the left menu and select headers */
  fullFrameContent$ = this.fullFrameContent.asObservable().pipe(delay(0));

  /** This observable last value (`withLatestFrom()`) determines whether a task is allowed to auto toggle full frame or not */
  readonly canAutoToggle$ = this.toggledManually$.pipe(
    switchMap(toggledManually => (toggledManually
      ? timer(delayUntilReactivateAutoToggle).pipe(mapTo(true), startWith(false))
      : of(true)
    )),
    startWith(true),
    distinctUntilChanged(),
    shareReplay(1),
  );

  private contentFooter = new BehaviorSubject<boolean>(true);
  /**
   * Adds a blank footer to the content area
   * Disabled for instance for displaying a task, as the task iframe is set to fill the screen to the bottom */
  contentFooter$ = this.contentFooter.asObservable().pipe(delay(0));

  /** Set fullFrameContent, which expands the content by hiding the left menu and select headers */
  toggleFullFrameContent(shown: boolean, isUserAction = false): void {
    this.toggledManually$.next(isUserAction);
    this.fullFrameContent.next(shown);
  }

  /** Set contentFooter, which adds a blank footer to the content side */
  toggleContentFooter(shown: boolean): void {
    this.contentFooter.next(shown);
  }
}
