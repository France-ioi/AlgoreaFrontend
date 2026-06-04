import { Component, inject, input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService } from 'src/app/services/auth/auth.service';
import { LayoutService } from '../../services/layout.service';
import { delay } from 'rxjs/operators';
import { TopRightControlsComponent } from '../top-right-controls/top-right-controls.component';
import { RouterLink } from '@angular/router';
import { LetDirective } from '@ngrx/component';
import { NgClass, AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';
import { APPCONFIG } from 'src/app/config';

@Component({
  selector: 'alg-left-header',
  templateUrl: './left-header.component.html',
  styleUrls: [ './left-header.component.scss' ],
  imports: [ LetDirective, NgClass, NgTemplateOutlet, RouterLink, TopRightControlsComponent, AsyncPipe, ButtonIconComponent, TooltipDirective ]
})
export class LeftHeaderComponent {
  private authService = inject(AuthService);
  private layoutService = inject(LayoutService);
  private titleService = inject(Title);

  compactMode = input(false);
  hideTree = input(false);
  treeHidden = input(false);

  title = this.titleService.getTitle();

  showTopRightControls$ = this.layoutService.showTopRightControls$.pipe(delay(0));
  isNarrowScreen$ = this.layoutService.isNarrowScreen$;
  leftHeaderLogoUrl = inject(APPCONFIG).leftHeaderLogoUrl;

  hideLeftMenu(): void {
    this.layoutService.toggleLeftMenu(false);
  }

  login(): void {
    this.authService.startAuthLogin();
  }

}
