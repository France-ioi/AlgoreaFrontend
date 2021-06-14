import { AfterViewInit, OnDestroy, SimpleChanges } from '@angular/core';
import { Component, EventEmitter, Input, Output, ViewChild, OnChanges } from '@angular/core';
import { OverlayPanel } from 'primeng/overlaypanel';
import { animationFrames, merge, ReplaySubject, Subscription } from 'rxjs';
import { filter, mapTo, switchMap, take } from 'rxjs/operators';
import { TeamUserProgress } from 'src/app/shared/http-services/get-group-progress.service';

@Component({
  selector: 'alg-user-progress-details',
  templateUrl: './user-progress-details.component.html',
  styleUrls: [ './user-progress-details.component.scss' ],
})
export class UserProgressDetailsComponent implements OnChanges, OnDestroy, AfterViewInit {

  @Input() progress?: TeamUserProgress;
  @Input() canAccess?: boolean;
  @Input() target?: Element;

  @Output() accessPermissions = new EventEmitter<void>();
  @Output() hide = new EventEmitter<void>();

  @ViewChild('panel') panel?: OverlayPanel;

  // NOTE: when the progress changes, there is a time between closing the previous overlay and opening a new one
  // `displayedProgress` is the progress displayed in the overlay
  // This value is populated *only* when the overlay is shown, not before.
  displayedProgress?: TeamUserProgress;
  isSuccess?: boolean;
  hasScore?: boolean;
  forwardHideEvent = false;

  private subscriptions = new Subscription();
  private overlay$ = new ReplaySubject<{ previousTarget?: Element, nextTarget?: Element, progress?: TeamUserProgress }>(1);

  private overlayWithProgress = this.overlay$.pipe(
    filter(({ progress }) => !!progress && (progress.validated || progress.score > 0 || progress.timeSpent > 0)),
  );
  private open$ = this.overlayWithProgress.pipe(filter(({ previousTarget, nextTarget }) => !previousTarget && !!nextTarget));
  private reopen$ = this.overlayWithProgress.pipe(
    filter(({ previousTarget, nextTarget }) => !!nextTarget && !!previousTarget && previousTarget !== nextTarget),
  );
  private hide$ = merge(
    this.overlay$.pipe(filter(({ nextTarget }) => !nextTarget)),
    this.reopen$,
  );
  private openOrReopen$ = merge(
    this.open$,
    this.reopen$.pipe(
      switchMap(data => {
        if (!this.panel) throw new Error('panel must be defined');
        return this.panel.onHide.asObservable().pipe(mapTo(data), take(1));
      }),
    )
  );

  ngAfterViewInit(): void {
    this.subscriptions.add(
      this.hide$.subscribe(() => {
        this.forwardHideEvent = false;
        this.panel?.hide();
      })
    );
    this.subscriptions.add(
      this.openOrReopen$
        .pipe(switchMap(data => animationFrames().pipe(mapTo(data), take(1))))
        .subscribe(({ nextTarget, progress }) => {
          if (!this.panel) throw new Error('panel must be defined');
          this.forwardHideEvent = true;
          this.displayedProgress = progress;
          this.isSuccess = progress && (progress.validated || progress.score === 100);
          this.hasScore = !this.isSuccess;
          this.panel.show(null, nextTarget);
        })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.target) {
      this.overlay$.next({
        previousTarget: changes.target.previousValue as Element,
        nextTarget: this.target,
        progress: this.progress,
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onOverlayHide(): void {
    if (this.forwardHideEvent) this.hide.emit();
  }

}
