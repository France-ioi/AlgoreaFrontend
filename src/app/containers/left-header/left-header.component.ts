import { Component, inject, input } from '@angular/core';
import { LayoutService } from '../../services/layout.service';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';
import { PlatformLogoComponent } from 'src/app/ui-components/platform-logo/platform-logo.component';

@Component({
  selector: 'alg-left-header',
  templateUrl: './left-header.component.html',
  styleUrl: './left-header.component.scss',
  imports: [
    AsyncPipe,
    NgTemplateOutlet,
    ButtonIconComponent,
    TooltipDirective,
    PlatformLogoComponent,
  ]
})
export class LeftHeaderComponent {
  private layoutService = inject(LayoutService);

  compactMode = input(false);
  hideTree = input(false);
  treeHidden = input(false);

  isNarrowScreen$ = this.layoutService.isNarrowScreen$;

  hideLeftMenu(): void {
    this.layoutService.toggleLeftMenu(false);
  }

}
