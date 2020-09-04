import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { AuthService } from 'src/app/shared/auth/auth.service';

@Component({
  selector: 'alg-top-nav',
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.scss']
})
export class TopNavComponent implements OnInit {

  @Input() collapsed = false;
  @Input() templateId = 0;
  @Input() folded = false;
  @Input() signedIn = true;

  @Output() collapse = new EventEmitter<boolean>();
  @Output() fold = new EventEmitter<boolean>();
  @Output() notify = new EventEmitter<any>();
  @Output() search = new EventEmitter<any>();
  @Output() searchClose = new EventEmitter<any>();

  showNotification = false;

  langs = [
    'English',
    'Francais',
    'Espanol',
    'Czech',
    'Deutsch'
  ];

  constructor(
    private authService: AuthService
  ) { }

  ngOnInit() {
  }

  onCollapse() {
    this.collapsed = !this.collapsed;
    this.collapse.emit(this.collapsed);
  }

  onFold() {
    this.folded = !this.folded;
    this.fold.emit(this.folded);
  }

  toggleNotification(e) {
    this.showNotification = !this.showNotification;
    this.notify.emit(e);
  }

  signInOut() {
    if (this.authService.authUserConnected()) {
      this.authService.logoutAuthUser();
    } else {
      this.authService.startLogin();
    }
  }

  onSearchEvent(e) {
    this.search.emit(e);
  }

  onSearchCloseEvent(e) {
    this.searchClose.emit(e);
  }

}
