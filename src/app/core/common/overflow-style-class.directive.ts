import { AfterViewChecked, Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[trwOverflowStyleClass]'
})
export class OverflowStyleClassDirective implements AfterViewChecked {
  @Input() trwOverflowStyleClassNames?: string;

  originalScrollWidth = 0;

  constructor(private el: ElementRef, private renderer: Renderer2) {
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.processOverflow();
  }

  ngAfterViewChecked(): void {
    this.processOverflow();
  }

  processOverflow(): void {
    if (!this.trwOverflowStyleClassNames) {
      return;
    }

    const { clientWidth, scrollWidth } = this.el.nativeElement;

    // console.log('scrollWidth', scrollWidth);
    // console.log('scrollWidth', scrollWidth);

    if (clientWidth < scrollWidth) {
      this.originalScrollWidth = scrollWidth;
      this.renderer.addClass(this.el.nativeElement, this.trwOverflowStyleClassNames);
      return;
    }

    if (this.originalScrollWidth !== 0 && clientWidth > this.originalScrollWidth) {
      this.originalScrollWidth = 0;
      this.renderer.removeClass(this.el.nativeElement, this.trwOverflowStyleClassNames);
    }
  }
}
