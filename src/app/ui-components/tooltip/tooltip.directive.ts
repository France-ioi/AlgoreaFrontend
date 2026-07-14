import {
  AfterViewInit,
  ComponentRef,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  TemplateRef,
} from '@angular/core';
import { ConnectedPosition, Overlay } from '@angular/cdk/overlay';
import { BehaviorSubject, combineLatest, EMPTY, fromEvent, merge, Observable, of, timer } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, shareReplay, switchMap, take, takeUntil } from 'rxjs/operators';
import { ComponentPortal } from '@angular/cdk/portal';
import { TooltipComponent } from './tooltip.component';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { deviceSupportsHover } from 'src/app/utils/device-supports-hover';

export type TooltipPosition = 'top' | 'bottom' | 'right' | 'left';

const topPosition: ConnectedPosition = {
  originX: 'center',
  originY: 'top',
  overlayX: 'center',
  overlayY: 'bottom',
  panelClass: 'alg-tooltip-top',
};

const bottomPosition: ConnectedPosition = {
  originX: 'center',
  originY: 'bottom',
  overlayX: 'center',
  overlayY: 'top',
  panelClass: 'alg-tooltip-bottom',
};

const leftPosition: ConnectedPosition = {
  originX: 'start',
  originY: 'center',
  overlayX: 'end',
  overlayY: 'center',
  panelClass: 'alg-tooltip-left',
};

const rightPosition: ConnectedPosition = {
  originX: 'end',
  originY: 'center',
  overlayX: 'start',
  overlayY: 'center',
  panelClass: 'alg-tooltip-right',
};

const tooltipHideDelayMs = 100;

const positions = new Map<TooltipPosition, ConnectedPosition[]>([
  [ 'top', [ topPosition, bottomPosition ] ],
  [ 'bottom', [ bottomPosition, topPosition ] ],
  [ 'left', [ leftPosition, rightPosition ] ],
  [ 'right', [ rightPosition, leftPosition ] ],
]);

@Directive({
  selector: '[algTooltip]',
})
export class TooltipDirective implements AfterViewInit, OnDestroy {
  private overlay = inject(Overlay);
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private destroyRef = inject(DestroyRef);

  tooltipContent = input.required<string | TemplateRef<HTMLElement>>({ alias: 'algTooltip' });
  tooltipDelay = input<number>();
  tooltipPosition = input<TooltipPosition>('bottom');
  tooltipStyleClass = input('');
  tooltipDisabled = input(false);
  tooltipEvent = input<'hover' | 'focus'>('hover');

  tooltipEvent$ = toObservable(this.tooltipEvent);

  private overlayRef = this.overlay.create({
    scrollStrategy: this.overlay.scrollStrategies.close(),
  });

  private readonly showOverlaySubject$ = new BehaviorSubject<Event|undefined>(undefined);
  private showOverlay$ = combineLatest([
    toObservable(this.tooltipDisabled),
    toObservable(this.tooltipDelay),
  ]).pipe(
    switchMap(([ tooltipDisabled, delay ]) =>
      (tooltipDisabled ? EMPTY : merge(
        delay ? this.showOverlaySubject$.pipe(debounceTime(delay)) : this.showOverlaySubject$,
        this.showOverlaySubject$.pipe(filter(value => !value)), // this allows to close the overlay immediately and not after debounce delay
      )),
    )
  ).pipe(distinctUntilChanged(), shareReplay(1));

  ngAfterViewInit(): void {
    this.overlayRef.updatePositionStrategy(
      this.overlay.position()
        .flexibleConnectedTo(this.elementRef.nativeElement)
        .withPositions(positions.get(this.tooltipPosition()) || [ bottomPosition, topPosition ])
        .withFlexibleDimensions(false)
        .withPush(false)
    );

    this.tooltipEvent$.pipe(
      switchMap(event => (event === 'hover'
        ? this.hoverShowEvents$()
        : merge(
          fromEvent(this.elementRef.nativeElement, 'focus'),
          fromEvent(this.elementRef.nativeElement, 'blur').pipe(map(() => undefined)),
        ))),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(event => {
      this.showOverlaySubject$.next(event);
    });

    this.showOverlay$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
      if (event) {
        this.attachOverlay();
      } else {
        this.detachOverlay();
      }
    });
  }

  ngOnDestroy(): void {
    this.showOverlaySubject$.complete();
    // dispose() tears down the overlay host; detach() only removes the portal and leaves it in the DOM.
    this.overlayRef.dispose();
  }

  private hoverShowEvents$(): Observable<Event | undefined> {
    // On touch/non-hover devices a tap fires `mouseenter` but no reliable `mouseleave`,
    // leaving the tooltip stranded on screen. Suppress hover tooltips there entirely.
    if (!deviceSupportsHover()) return EMPTY;

    const host = this.elementRef.nativeElement;
    const mouseEnter$ = fromEvent<MouseEvent>(host, 'mouseenter');
    const mouseLeave$ = fromEvent<MouseEvent>(host, 'mouseleave');

    return mouseEnter$.pipe(
      switchMap(enterEvent => merge(
        of(enterEvent),
        mouseLeave$.pipe(
          take(1),
          switchMap(() => timer(tooltipHideDelayMs)),
          map(() => undefined),
          takeUntil(mouseEnter$),
        ),
      )),
    );
  }

  private attachOverlay(): void {
    const tooltipContent = this.tooltipContent();
    if (typeof tooltipContent === 'string' && tooltipContent.trim() === '') return;

    if (!this.overlayRef.hasAttached()) {
      const tooltipPortal = new ComponentPortal(TooltipComponent);
      const tooltipRef: ComponentRef<TooltipComponent> = this.overlayRef.attach(tooltipPortal);

      if (tooltipContent instanceof TemplateRef) {
        tooltipRef.instance.contentTemplate.set(tooltipContent);
      } else {
        tooltipRef.instance.text.set(tooltipContent);
      }

      tooltipRef.instance.styleClass.set(this.tooltipStyleClass());
      this.makeOverlayNonInteractive();
    }
  }

  private makeOverlayNonInteractive(): void {
    // Inline styles beat CDK's `.cdk-overlay-pane { pointer-events: auto }`, which otherwise wins over global CSS.
    // hostElement is the connected-position bounding box; reset its global negative margin so it does not overlap the trigger.
    this.overlayRef.hostElement.style.pointerEvents = 'none';
    this.overlayRef.hostElement.style.marginBottom = '0';
    this.overlayRef.overlayElement.style.pointerEvents = 'none';
  }

  private detachOverlay(): void {
    if (this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
    }
  }
}
