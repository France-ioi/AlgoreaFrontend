import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { StatusService } from '../../../shared/services/status.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/shared/auth/auth.service';

@Component({
  selector: 'alg-top-nav',
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.scss']
})
export class TopNavComponent implements OnInit {

  @Output() collapseEvent = new EventEmitter<boolean>();
  @Output() foldEvent = new EventEmitter<boolean>();
  @Output() signInOutEvent = new EventEmitter<boolean>();

  @Input() collapsed = false;
  @Input() templateId = 0;
  @Input() folded = false;

  @Input() data;

  showNotification = false;
  @Input() signedIn = true;

  @Output() notify = new EventEmitter<any>();
  @Output() search = new EventEmitter<any>();
  @Output() searchClose = new EventEmitter<any>();

  langs = [
    'English',
    'Francais',
    'Espanol',
    'Czech',
    'Deutsch'
  ];

  constructor(
    private statusService: StatusService,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit() {
  }

  onCollapse() {
    this.collapsed = !this.collapsed;
    this.collapseEvent.emit(this.collapsed);
  }

  onFold() {
    this.folded = !this.folded;
    this.foldEvent.emit(this.folded);
  }

  toggleNotification(e) {
    this.showNotification = !this.showNotification;
    this.statusService.setUrl(this.router.url);
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
