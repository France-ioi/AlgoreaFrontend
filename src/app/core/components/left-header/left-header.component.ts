import { Component, Input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService } from 'src/app/shared/auth/auth.service';
import { LayoutService } from 'src/app/shared/services/layout.service';
import { delay } from 'rxjs/operators';

@Component({
  selector: 'alg-left-header',
  templateUrl: './left-header.component.html',
  styleUrls: [ './left-header.component.scss' ]
})
export class LeftHeaderComponent {

  @Input() compactMode = false;

  title = this.titleService.getTitle();

  showTopRightControls$ = this.layoutService.showTopRightControls$.pipe(delay(0));
  isNarrowScreen$ = this.layoutService.isNarrowScreen$;

  constructor(
    private authService: AuthService,
    private layoutService: LayoutService,
    private titleService: Title,
  ) { }

  hideLeftMenu(): void {
    this.layoutService.toggleLeftMenu(false);
  }

  login(): void {
    this.authService.startAuthLogin();
  }

}
