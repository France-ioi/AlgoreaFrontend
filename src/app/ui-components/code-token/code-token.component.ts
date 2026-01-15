import { Component, Output, EventEmitter, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';

@Component({
  selector: 'alg-code-token',
  templateUrl: './code-token.component.html',
  styleUrls: [ './code-token.component.scss' ],
  imports: [
    NgClass,
    ButtonIconComponent,
    TooltipDirective,
  ]
})
export class CodeTokenComponent {
  @Input() showRefresh = true;
  @Input() showRemove = false;
  @Input() code = '...';

  @Output() refresh = new EventEmitter<void>();
  @Output() remove = new EventEmitter<void>();

  refreshCode(): void {
    this.refresh.emit();
  }

  removeCode(): void {
    this.remove.emit();
  }
}
