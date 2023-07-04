import { AfterViewInit, Directive, ElementRef, EventEmitter, Output } from '@angular/core';

@Directive({
  selector: '[algHtmlElLoaded]',
})
export class HtmlElLoadedDirective implements AfterViewInit {
  @Output() elLoaded = new EventEmitter<HTMLElement>();

  constructor(
    private el: ElementRef<HTMLElement>,
  ) {}

  ngAfterViewInit(): void {
    this.elLoaded.emit(this.el.nativeElement);
  }
}
