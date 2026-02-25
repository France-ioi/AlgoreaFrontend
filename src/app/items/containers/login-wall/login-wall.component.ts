import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';
import { filter, fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserSessionService } from 'src/app/services/user-session.service';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';

@Component({
  selector: 'alg-login-wall',
  templateUrl: './login-wall.component.html',
  styleUrls: [ './login-wall.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ ButtonComponent ],
})
export class LoginWallComponent implements OnInit {
  private userSessionService = inject(UserSessionService);
  private destroyRef = inject(DestroyRef);

  description = input<string>();
  isLoginButtonClicked = signal(false);

  ngOnInit(): void {
    fromEvent<PageTransitionEvent>(window, 'pageshow').pipe(
      filter(event => event.persisted),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.isLoginButtonClicked.set(false);
    });
  }

  login(): void {
    this.isLoginButtonClicked.set(true);
    this.userSessionService.login();
  }
}
