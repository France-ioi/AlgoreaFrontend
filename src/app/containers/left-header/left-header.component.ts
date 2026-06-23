import { Component, inject, input } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { LayoutService } from '../../services/layout.service';
import { delay } from 'rxjs/operators';
import { TopRightControlsComponent } from '../top-right-controls/top-right-controls.component';
import { LetDirective } from '@ngrx/component';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';
import { PlatformLogoComponent } from 'src/app/ui-components/platform-logo/platform-logo.component';

@Component({
  selector: 'alg-left-header',
  templateUrl: './left-header.component.html',
  styleUrls: [ './left-header.component.scss' ],
  imports: [
    LetDirective,
    NgTemplateOutlet,
    TopRightControlsComponent,
    AsyncPipe,
    ButtonIconComponent,
    TooltipDirective,
    PlatformLogoComponent,
  ]
})
export class LeftHeaderComponent {
  private authService = inject(AuthService);
  private layoutService = inject(LayoutService);

  compactMode = input(false);
  hideTree = input(false);
  treeHidden = input(false);

  showTopRightControls$ = this.layoutService.showTopRightControls$.pipe(delay(0));
  isNarrowScreen$ = this.layoutService.isNarrowScreen$;

  hideLeftMenu(): void {
    this.layoutService.toggleLeftMenu(false);
  }

  login(): void {
    this.authService.startAuthLogin();
  }

}
