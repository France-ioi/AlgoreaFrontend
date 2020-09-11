import { Component, HostListener, OnInit } from '@angular/core';
import { CurrentUserService } from '../shared/services/current-user.service';
import { filter, skip } from 'rxjs/operators';
import { UserProfile } from '../shared/http-services/current-user.service';

@Component({
  selector: 'alg-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  editing = false;
  isStarted = true;

  langs = [
    'English',
    'Francais',
    'Espanol',
    'Czech',
    'Deutsch'
  ];

  breaddata = {
    selectedID: '42',
    path: [
      { ID: '1', label: 'Contest', separator: 'slash' },
      {
        ID: '42',
        label: 'Personalized contest',
        attempt: 12,
        separator: 'arrow'
      },
      { ID: '43', label: 'Personalized contests', attempt: 12 },
      { ID: '23', label: 'IOI Selection 2012', attempt: 2 },
      { ID: '24', label: 'Individuals', separator: 'slash' }
    ]
  };

  collapsed = false;
  folded = false;
  scrolled = false;

  selectedType = -1;

  constructor(
    private currentUserService: CurrentUserService,
  ) {}

  ngOnInit() {
   // each time there is a new user, refresh the page
    this.currentUserService.currentUser().pipe(
      filter<UserProfile|null, UserProfile>((user):user is UserProfile => user !== null),
      skip(1), // do not refresh when the first user is set
    ).subscribe((_user) => {
      window.location.reload();
    });
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
    this.editing = true;
  }

  onEditCancel() {
    this.editing = false;
  }

}
