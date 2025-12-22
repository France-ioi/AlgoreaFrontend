import {
  AfterViewInit,
  ComponentRef,
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  TemplateRef,
} from '@angular/core';
import { ConnectedPosition, Overlay } from '@angular/cdk/overlay';
import { BehaviorSubject, merge, Subject, combineLatest, EMPTY, fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, shareReplay, switchMap, takeUntil } from 'rxjs/operators';
import { ComponentPortal } from '@angular/cdk/portal';
import { TooltipComponent } from './tooltip.component';
import { toObservable } from '@angular/core/rxjs-interop';

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

const positions = new Map<TooltipPosition, ConnectedPosition[]>([
  [ 'top', [ topPosition, bottomPosition ] ],
  [ 'bottom', [ bottomPosition, topPosition ] ],
  [ 'left', [ leftPosition, rightPosition ] ],
  [ 'right', [ rightPosition, leftPosition ] ],
]);

@Directive({
  selector: '[algTooltip]',
  standalone: true,
})
export class TooltipDirective implements AfterViewInit, OnDestroy {
  private overlay = inject(Overlay);
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

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

  readonly destroyed$ = new Subject<void>();
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
      switchMap(event =>
        merge(
          fromEvent(this.elementRef.nativeElement, event === 'hover' ? 'mouseenter' : 'focus'),
          fromEvent(this.elementRef.nativeElement, event === 'hover' ? 'mouseleave' : 'blur').pipe(map(() => undefined)),
        )
      ),
      takeUntil(this.destroyed$),
    ).subscribe(event => {
      this.showOverlaySubject$.next(event);
    });

    this.showOverlay$.pipe(takeUntil(this.destroyed$)).subscribe(event => {
      if (event) {
        this.attachOverlay();
      } else {
        this.detachOverlay();
      }
    });
  }

  ngOnDestroy(): void {
    this.showOverlaySubject$.complete();
    this.destroyed$.next();
    this.destroyed$.complete();
    this.detachOverlay();
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
    }
  }

  private detachOverlay(): void {
    if (this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
    }
  }
}
