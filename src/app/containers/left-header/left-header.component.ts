import { Component, Input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService } from 'src/app/services/auth/auth.service';
import { LayoutService } from '../../services/layout.service';
import { delay } from 'rxjs/operators';
import { TopRightControlsComponent } from '../top-right-controls/top-right-controls.component';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { LetDirective } from '@ngrx/component';
import { NgIf, NgClass, AsyncPipe } from '@angular/common';

@Component({
  selector: 'alg-left-header',
  templateUrl: './left-header.component.html',
  styleUrls: [ './left-header.component.scss' ],
  standalone: true,
  imports: [ NgIf, LetDirective, NgClass, RouterLink, ButtonModule, TopRightControlsComponent, AsyncPipe ]
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
