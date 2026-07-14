import {
  AfterViewInit,
  contentChild,
  DestroyRef,
  Directive,
  inject,
  input,
  OnDestroy,
  output,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';
import { ShowOverlayHoverTargetDirective } from 'src/app/ui-components/overlay/show-overlay-hover-target.directive';
import { BehaviorSubject, fromEvent, merge } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, shareReplay } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { canCloseOverlay } from 'src/app/utils/overlay';
import { Overlay } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

@Directive({
  selector: '[algShowOverlay]',
  exportAs: 'algShowOverlay',
  host: {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Angular host event binding
    '(mouseleave)': 'onHover($event)',
  },
})
export class ShowOverlayDirective implements OnDestroy, AfterViewInit {
  overlayOpenEvent = output<Event>();
  overlayCloseEvent = output();
  algShowOverlay = input.required<TemplateRef<unknown>>();

  overlayHoverTarget = contentChild.required(ShowOverlayHoverTargetDirective);

  private readonly showOverlaySubject$ = new BehaviorSubject<Event|undefined>(undefined);
  private showOverlay$ = merge(
    this.showOverlaySubject$.pipe(debounceTime(750)),
    this.showOverlaySubject$.pipe(filter(value => !value)), // this allows to close the overlay immediately and not after debounce delay
  ).pipe(distinctUntilChanged(), shareReplay(1));

  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);
  private destroyRef = inject(DestroyRef);

  private overlayRef = this.overlay.create({
    scrollStrategy: this.overlay.scrollStrategies.reposition(),
    panelClass: 'alg-path-suggestion-overlay',
  });

  onHover(event: MouseEvent): void {
    if (canCloseOverlay(event)) {
      this.showOverlaySubject$.next(undefined);
    }
  }

  ngAfterViewInit(): void {
    this.overlayRef.updatePositionStrategy(
      this.overlay.position().flexibleConnectedTo(
        this.overlayHoverTarget().nativeElement,
      ).withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
        },
        {
          originX: 'start',
          originY: 'center',
          overlayX: 'end',
          overlayY: 'center',
        },
        {
          originX: 'end',
          originY: 'center',
          overlayX: 'start',
          overlayY: 'center',
        },
      ])
    );

    this.showOverlay$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
      if (event) {
        this.attachOverlay();
        this.overlayOpenEvent.emit(event);
      } else {
        this.detachOverlay();
        this.overlayCloseEvent.emit();
      }
    });

    fromEvent(this.overlayHoverTarget().nativeElement, 'mouseenter').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
      this.showOverlaySubject$.next(event);
    });

    fromEvent(this.overlayRef.hostElement, 'mouseleave').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() =>
      this.showOverlaySubject$.next(undefined)
    );
  }

  ngOnDestroy(): void {
    this.showOverlaySubject$.complete();
    // dispose() tears down the overlay host; detach() only removes the portal and leaves it in the DOM.
    this.overlayRef.dispose();
  }

  private attachOverlay(): void {
    if (!this.overlayRef.hasAttached()) {
      const portal = new TemplatePortal(this.algShowOverlay(), this.viewContainerRef);
      this.overlayRef.attach(portal);
    }
  }

  private detachOverlay(): void {
    if (this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
    }
  }

  updatePosition(): void {
    this.overlayRef.updatePosition();
  }
}
