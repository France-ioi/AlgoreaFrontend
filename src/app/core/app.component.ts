import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { UserSession, UserSessionService } from '../shared/services/user-session.service';
import { delay, filter, map, skip } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
import { CurrentContentService } from '../shared/services/current-content.service';
import { AuthService, AuthServiceState } from '../shared/auth/auth.service';
import { Router } from '@angular/router';
import { ModeAction, ModeService } from '../shared/services/mode.service';
import { ContentInfo } from '../shared/models/content/content-info';

@Component({
  selector: 'alg-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.scss' ]
})
export class AppComponent implements OnInit, OnDestroy {

  // the delay(0) is used to prevent the UI to update itself (when the content is loaded) (ExpressionChangedAfterItHasBeenCheckedError)
  currentContent$: Observable<ContentInfo|null> = this.currentContent.currentContent$.pipe(delay(0));
  readonly currentMode$ = this.modeService.mode$.asObservable().pipe(delay(0));
  session$ = this.sessionService.session$.pipe(delay(0));
  authOnError$ = this.authService.state$.pipe(map(state => state === AuthServiceState.Error));

  leftMenuDisplayed = true;
  headersDisplayed = true;
  scrolled = false;

  private subscription?: Subscription;

  constructor(
    private router: Router,
    private sessionService: UserSessionService,
    private authService: AuthService,
    private currentContent: CurrentContentService,
    private modeService: ModeService,
  ) {}

  ngOnInit(): void {
    // each time there is a new user, refresh the page
    this.subscription = this.sessionService.session$.pipe(
      filter<UserSession|undefined, UserSession>((session):session is UserSession => !!session),
      skip(1), // do not refresh when the first user is set
    ).subscribe(_session => {
      // Navigate to the root with an ugly hack to make sure the full content is reloaded
      void this.router.navigateByUrl('/groups/me', { skipLocationChange: true }).then(() => this.router.navigateByUrl('/'));
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  toggleLeftMenuDisplay(shown: boolean): void {
    this.leftMenuDisplayed = shown;
    if (shown) this.headersDisplayed = true;
  }

  toggleHeadersDisplay(shown: boolean): void {
    this.headersDisplayed = shown;
  }

  @HostListener('window:scroll', [ '$event' ])
  onScrollContent(): void{
    if (window.pageYOffset > 40 && !this.scrolled) {
      this.scrolled = true;
    } else if (window.pageYOffset <= 40 && this.scrolled) {
      this.scrolled = false;
    }
  }

  onEditCancel() : void{
    this.modeService.modeActions$.next(ModeAction.StopEditing);
  }

}
