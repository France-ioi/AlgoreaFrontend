import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CurrentUserService } from '../shared/services/current-user.service';
import { delay, filter, skip } from 'rxjs/operators';
import { UserProfile } from '../shared/http-services/current-user.service';
import { Observable, Subscription } from 'rxjs';
import { ContentInfo, CurrentContentService, EditAction } from '../shared/services/current-content.service';
import { AuthService } from '../shared/auth/auth.service';

@Component({
  selector: 'alg-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  // the delay(0) is used to prevent the UI to update itself (when the content is loaded) (ExpressionChangedAfterItHasBeenCheckedError)
  currentContent$: Observable<ContentInfo|null>  = this.currentContent.currentContent$.pipe( delay(0) );
  editState$ = this.currentContent.editState$.pipe( delay(0) );
  currentUser$ = this.currentUserService.currentUser$.pipe( delay(0) );

  collapsed = false;
  folded = false;
  scrolled = false;

  private subscription: Subscription;

  constructor(
    private currentUserService: CurrentUserService,
    private authService: AuthService,
    private currentContent: CurrentContentService,
  ) {}

  ngOnInit() {
    // each time there is a new user, refresh the page
    this.subscription = this.currentUserService.currentUser$.pipe(
      filter<UserProfile|undefined, UserProfile>((user):user is UserProfile => !!user),
      skip(1), // do not refresh when the first user is set
    ).subscribe(_user => {
      window.location.reload();
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onCollapse(e: boolean) {
    this.collapsed = e;
    if (!this.collapsed) {
      this.folded = false;
    }
  }

  onFold(folded: boolean) {
    this.folded = folded;
  }

  @HostListener('window:scroll', ['$event'])
  onScrollContent() {
    if (window.pageYOffset > 40 && !this.scrolled) {
      this.scrolled = true;
    } else if (window.pageYOffset <= 40 && this.scrolled) {
      this.scrolled = false;
    }
  }

  onEditPage() {
    this.currentContent.editAction.next(EditAction.StartEditing);
  }

  onEditCancel() {
    this.currentContent.editAction.next(EditAction.StopEditing);
  }

  onEditSave() {
    this.currentContent.editAction.next(EditAction.Save);
  }

  login() {
    this.authService.startAuthLogin();
  }

  logout() {
    this.authService.logoutAuthUser();
  }

}
