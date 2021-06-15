import { AfterViewInit, OnDestroy, SimpleChanges } from '@angular/core';
import { Component, EventEmitter, Input, Output, ViewChild, OnChanges } from '@angular/core';
import { OverlayPanel } from 'primeng/overlaypanel';
import { animationFrames, merge, ReplaySubject, Subscription } from 'rxjs';
import { filter, mapTo, startWith, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { ensureDefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { TeamUserProgress } from 'src/app/shared/http-services/get-group-progress.service';

@Component({
  selector: 'alg-user-progress-details',
  templateUrl: './user-progress-details.component.html',
  styleUrls: [ './user-progress-details.component.scss' ],
})
export class UserProgressDetailsComponent implements OnChanges, OnDestroy, AfterViewInit {

  @Input() progress?: TeamUserProgress;
  @Input() canEditPermissions?: boolean;
  @Input() target?: Element;

  @Output() editPermissions = new EventEmitter<void>();
  @Output() hide = new EventEmitter<void>();

  @ViewChild('panel') panel?: OverlayPanel;

  private overlay$ = new ReplaySubject<{ previousTarget?: Element, nextTarget?: Element, progress?: TeamUserProgress }>(1);

  private overlayWithProgress$ = this.overlay$.pipe(
    filter(({ progress }) => !!progress && (progress.validated || progress.score > 0 || progress.timeSpent > 0)),
  );
  private hiddenOverlayToOpen$ = this.overlayWithProgress$.pipe(
    filter(({ previousTarget, nextTarget }) => !previousTarget && !!nextTarget)
  );
  private openedOverlayToReopen$ = this.overlayWithProgress$.pipe(
    filter(({ previousTarget, nextTarget }) => !!nextTarget && !!previousTarget && previousTarget !== nextTarget),
  );
  private hiddenOverlayToReopen$ = this.openedOverlayToReopen$.pipe(
    switchMap(data => ensureDefined(this.panel).onHide.asObservable().pipe(mapTo(data), take(1))),
  );
  private hiddenOverlay$ = merge(
    this.overlay$.pipe(filter(({ nextTarget }) => !nextTarget)),
    this.openedOverlayToReopen$,
  ).pipe(switchMap(data => animationFrames().pipe(take(1), mapTo(data))));

  openedOverlay$ = merge(
    this.hiddenOverlayToOpen$,
    this.hiddenOverlayToReopen$,
  ).pipe(switchMap(data => animationFrames().pipe(take(1), mapTo(data))));

  private overlayIsReopening$ = merge(
    this.openedOverlayToReopen$.pipe(mapTo(true)),
    this.hiddenOverlayToReopen$.pipe(mapTo(false)),
  ).pipe(startWith(false));

  private onHideSubscription?: Subscription;

  ngAfterViewInit(): void {
    this.hiddenOverlay$.subscribe(() => this.panel?.hide());
    this.openedOverlay$.subscribe(({ nextTarget }) => ensureDefined(this.panel).show(null, nextTarget));
    this.onHideSubscription = ensureDefined(this.panel).onHide.pipe(
      withLatestFrom(this.overlayIsReopening$),
      filter(([ , isReopening ]) => !isReopening),
    ).subscribe(() => this.hide.emit());
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
    this.overlay$.complete();
    this.onHideSubscription?.unsubscribe();
  }

}
