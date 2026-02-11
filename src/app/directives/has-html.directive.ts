import { Directive, inject, Input, OnChanges, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[algHasHTML]',
  standalone: true,
})
export class HasHTMLDirective implements OnChanges {
  private templateRef = inject<TemplateRef<unknown>>(TemplateRef);
  private viewContainer = inject(ViewContainerRef);

  @Input() algHasHTML!: string;
  @Input() algHasHTMLElse?: TemplateRef<unknown>;

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
