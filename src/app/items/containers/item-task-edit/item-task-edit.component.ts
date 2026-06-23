import { Component, computed, effect, inject, input, output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FullHeightContentDirective } from 'src/app/directives/full-height-content.directive';


@Component({
  selector: 'alg-item-task-edit',
  templateUrl: './item-task-edit.component.html',
  styleUrl: './item-task-edit.component.scss',
  imports: [ FullHeightContentDirective ]
})
export class ItemTaskEditComponent {
  private sanitizer = inject(DomSanitizer);

  editorUrl = input<string>();
  redirectToDefaultTab = output<void>();

  sanitizedUrl = computed(() => {
    const url = this.editorUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : undefined;
  });

  constructor() {
    // Output emission from an effect is a deliberate exception: redirect when no editor URL is provided.
    effect(() => {
      if (!this.editorUrl()) this.redirectToDefaultTab.emit();
    });
  }

}
