import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { UserSessionService } from '../shared/services/user-session.service';
import { delay, switchMap } from 'rxjs/operators';
import { merge, Observable, Subscription } from 'rxjs';
import { CurrentContentService } from '../shared/services/current-content.service';
import { AuthService } from '../shared/auth/auth.service';
import { Router } from '@angular/router';
import { ModeAction, ModeService } from '../shared/services/mode.service';
import { ContentInfo } from '../shared/models/content/content-info';
import { LocaleService } from './services/localeService';
import { LayoutService } from '../shared/services/layout.service';

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
  fatalError$ = merge(
    this.authService.failure$,
    this.sessionService.userProfileError$,
    this.localeService.currentLangError$,
  );

  leftMenuAndHeaders = true;
  leftMenuAndHeadersSubscription? : Subscription;
  scrolled = false;

  private subscription?: Subscription;

  constructor(
    private router: Router,
    private sessionService: UserSessionService,
    private authService: AuthService,
    private currentContent: CurrentContentService,
    private modeService: ModeService,
    private localeService: LocaleService,
    private layoutService: LayoutService,
  ) {
    this.leftMenuAndHeadersSubscription = this.layoutService.leftMenuAndHeadersDisplayed$.subscribe(shown => {
      this.leftMenuAndHeaders = shown;
    });
  }

  ngOnInit(): void {
    // if user changes, navigate back to the root
    this.subscription = this.sessionService.userChanged$.pipe(
      switchMap(() => this.router.navigateByUrl('/')),
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.leftMenuAndHeadersSubscription?.unsubscribe();
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

  onWatchCancel(): void {
    this.modeService.stopObserving();
  }

}
