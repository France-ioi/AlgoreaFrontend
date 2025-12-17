import { Component, signal } from '@angular/core';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';

@Component({
  selector: 'alg-ui-page',
  templateUrl: './ui-page.component.html',
  styleUrls: [ './ui-page.component.scss' ],
  standalone: true,
  imports: [
    ButtonComponent,
    ButtonIconComponent,
    TooltipDirective,
  ]
})
export class UiPageComponent {
  tooltipDisabled = signal(false);
  tooltipEvent = signal<'hover' | 'focus'>('hover');
}
