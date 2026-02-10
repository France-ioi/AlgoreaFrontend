import {
  AfterViewChecked,
  Directive,
  ElementRef,
  HostListener,
  Input,
  NgZone,
  OnInit,
  OnChanges,
  Renderer2,
  SimpleChanges,
  inject,
} from '@angular/core';

@Directive({
  selector: '[algFullHeightContent]',
  standalone: true,
})
export class FullHeightContentDirective implements OnInit, AfterViewChecked, OnChanges {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private renderer = inject(Renderer2);
  private ngZone = inject(NgZone);

  @Input() algFullHeightContent = true;

  mainContainerEl = document.querySelector('#main-container');

  @HostListener('window:resize')
  resize(): void {
    this.setHeight();
  }

  ngOnInit(): void {
    if (window.getComputedStyle(this.el.nativeElement).display === 'inline') {
      this.renderer.setStyle(this.el.nativeElement, 'display', 'block');
    }
    if (this.algFullHeightContent) this.setHeight();
  }

  ngAfterViewChecked(): void {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        if (this.algFullHeightContent) this.setHeight();
      });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.algFullHeightContent && !changes.algFullHeightContent.firstChange) {
      this.algFullHeightContent ? this.setHeight() : this.unsetHeight();
    }
  }

  unsetHeight(): void {
    this.renderer.removeStyle(this.el.nativeElement, 'min-height');
    this.renderer.removeStyle(this.el.nativeElement, 'height');
  }

  setHeight(): void {
    const top = this.el.nativeElement.getBoundingClientRect().top + globalThis.scrollY;
    if (this.mainContainerEl) {
      const mainContainerPadding = window.getComputedStyle(this.mainContainerEl);
      this.renderer.setStyle(
        this.el.nativeElement, 'min-height', `calc(100vh - ${top + parseInt(mainContainerPadding.paddingBottom)}px)`
      );
    }
  }
}
