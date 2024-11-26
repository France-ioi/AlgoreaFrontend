import { AfterViewInit, ContentChild, Directive, HostListener, Input, OnDestroy, output } from '@angular/core';
import { ShowOverlayHoverTargetDirective } from 'src/app/ui-components/overlay/show-overlay-hover-target.directive';
import { BehaviorSubject, EMPTY, fromEvent, merge, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, shareReplay, switchMap, takeUntil } from 'rxjs/operators';
import { OverlayPanel } from 'primeng/overlaypanel';
import { canCloseOverlay } from 'src/app/utils/overlay';

@Directive({
  selector: '[algShowOverlay]',
  standalone: true,
})
export class ShowOverlayDirective implements OnDestroy, AfterViewInit {
  overlayOpenEvent = output<Event>();
  overlayCloseEvent = output();
  @Input({ required: true }) algShowOverlay!: OverlayPanel;

  @ContentChild(ShowOverlayHoverTargetDirective) overlayHoverTarget?: ShowOverlayHoverTargetDirective;

  readonly destroyed$ = new Subject<void>();
  private readonly showOverlaySubject$ = new BehaviorSubject<Event|undefined>(undefined);
  showOverlay$ = merge(
    this.showOverlaySubject$.pipe(debounceTime(750)),
    this.showOverlaySubject$.pipe(filter(value => !value)), // this allows to close the overlay immediately and not after debounce delay
  ).pipe(distinctUntilChanged(), shareReplay(1));

  @HostListener('mouseleave', [ '$event' ]) onHover(event: MouseEvent): void {
    if (canCloseOverlay(event)) {
      this.showOverlaySubject$.next(undefined);
    }
  }

  ngAfterViewInit(): void {
    if (!this.overlayHoverTarget) throw new Error('Unexpected: No "ShowOverlayHoverTargetDirective" provided');

    this.showOverlay$.pipe(takeUntil(this.destroyed$)).subscribe(event => {
      if (event) {
        this.algShowOverlay.toggle(event, event.target);
        this.overlayOpenEvent.emit(event);
      } else {
        this.algShowOverlay.hide();
        this.overlayCloseEvent.emit();
      }
    });

    fromEvent(this.overlayHoverTarget.nativeElement, 'mouseenter').pipe(takeUntil(this.destroyed$)).subscribe(event => {
      this.showOverlaySubject$.next(event);
    });

    this.algShowOverlay.onShow.pipe(
      switchMap(() => (this.algShowOverlay.container ? fromEvent(this.algShowOverlay.container, 'mouseleave') : EMPTY)),
      takeUntil(this.destroyed$),
    ).subscribe(() => {
      this.showOverlaySubject$.next(undefined);
    });
  }

  ngOnDestroy(): void {
    this.showOverlaySubject$.complete();
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
