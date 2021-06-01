import {
  Directive,
  ElementRef,
  Input, OnDestroy, OnInit,
  Renderer2
} from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

@Directive({
  selector: '[algHideOverflowList]',
})
export class HideOverflowListDirective implements OnInit, OnDestroy {
  @Input() algHideOverflowListStyleClass?: string;
  @Input() algHideOverflowListTarget?: string;

  private subscription?: Subscription;
  private nextElIdxForHide = 0;

  constructor(private el: ElementRef, private renderer: Renderer2) {
  }

  ngOnInit(): void {
    this.subscription = timer(0, 100).pipe(
      map(() => this.el.nativeElement.scrollWidth),
      distinctUntilChanged(),
    ).subscribe(() => {
      this.resetOverflowStylesAndSettings();
      this.checkAndHideOverflowedElements();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private resetOverflowStylesAndSettings(): void {
    if (!this.algHideOverflowListStyleClass) {
      return;
    }

    this.nextElIdxForHide = 0;

    const hiddenElements: HTMLElement[] = this.el.nativeElement.querySelectorAll('.hidden');

    hiddenElements.forEach(el => {
      this.renderer.removeClass(el, 'hidden');
    });

    this.renderer.removeClass(this.el.nativeElement, this.algHideOverflowListStyleClass);
  }

  private checkAndHideOverflowedElements(): void {
    if (!this.algHideOverflowListTarget || !this.algHideOverflowListStyleClass) {
      return;
    }

    const { clientWidth, scrollWidth } = this.el.nativeElement;
    const targetElements: HTMLElement[] = this.el.nativeElement.querySelectorAll(this.algHideOverflowListTarget);
    const hiddenElements: HTMLElement[] = this.el.nativeElement.querySelectorAll('.hidden');
    let checkAgain = false;

    if (scrollWidth > clientWidth) {
      targetElements.forEach((el, index) => {
        if (index === this.nextElIdxForHide && index !== targetElements.length - 1) {
          this.renderer.addClass(el, 'hidden');
          checkAgain = true;
        }
      });

      if (hiddenElements.length !== targetElements.length - 1 && checkAgain) {
        this.nextElIdxForHide += 1;
      }

      this.renderer.addClass(this.el.nativeElement, this.algHideOverflowListStyleClass);
    }

    if (checkAgain) {
      this.checkAndHideOverflowedElements();
    }
  }
}
