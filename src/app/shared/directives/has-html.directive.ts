import { Directive, Input, OnChanges, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[algHasHTML]',
  standalone: true,
})
export class HasHTMLDirective implements OnChanges {
  @Input() algHasHTML!: string;
  @Input() algHasHTMLElse?: TemplateRef<unknown>;

  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainer: ViewContainerRef
  ) {}

  ngOnChanges(): void {
    if (new DOMParser().parseFromString(this.algHasHTML, 'text/html').body.childElementCount > 0) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      return;
    } else if (this.algHasHTMLElse) {
      this.viewContainer.createEmbeddedView(this.algHasHTMLElse);
      return;
    }
    this.viewContainer.clear();
  }
}
