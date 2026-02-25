import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'alg-restricted-content',
  template: `
    <div class="restricted-content-header">
      <div class="restricted-content-icon-box" aria-hidden="true">
        <i class="ph-fill ph-lock-open restricted-content-icon"></i>
      </div>
      <h1 class="restricted-content-title alg-h1" i18n>Restricted Content</h1>
    </div>
    <div class="restricted-content-body">
      <ng-content></ng-content>
    </div>
  `,
  styleUrl: './restricted-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestrictedContentComponent {}
