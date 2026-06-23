import { Component, input, output } from '@angular/core';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';

@Component({
  selector: 'alg-code-token',
  templateUrl: './code-token.component.html',
  styleUrl: './code-token.component.scss',
  imports: [
    ButtonIconComponent,
    TooltipDirective,
  ]
})
export class CodeTokenComponent {
  showRefresh = input(true);
  showRemove = input(false);
  code = input('...');

  refresh = output<void>();
  remove = output<void>();

  refreshCode(): void {
    this.refresh.emit();
  }

  removeCode(): void {
    this.remove.emit();
  }
}
