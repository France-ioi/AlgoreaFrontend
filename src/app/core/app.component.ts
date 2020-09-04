/* eslint-disable */ /* FIXME disabled for now while this is the mockup code, to be removed afterwards */
import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'alg-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'dev';
  editing = false;
  curScore = 70;
  dispScore = 65;
  isStarted = true;

  langs = [
    'English',
    'Francais',
    'Espanol',
    'Czech',
    'Deutsch'
  ];

  // Tree Data

  files;
  groups;
  trees;

  allowFullScreen = false;

  breaddata = {
    selectedID: 42,
    path: [
      { ID: 1, label: 'Contest', separator: 'slash' },
      {
        ID: 42,
        label: 'Personalized contest',
        attempt: 12,
        separator: 'arrow'
      },
      { ID: 43, label: 'Personalized contests', attempt: 12 },
      { ID: 23, label: 'IOI Selection 2012', attempt: 2 },
      { ID: 24, label: 'Individuals', separator: 'slash' }
    ]
  };

  breadhome = {
    selectedID: -1,
    path: [
      { ID: 1, label: 'Home' }
    ]
  };

  user = {
    name: 'Concours castor',
    notification: 2,
    image: '_messi.jpg'
  };

  collapsed = false;
  folded = false;
  scrolled = false;
  signedIn = true;
  notified = false;
  activityORSkill = true;

  taskdata;
  selectedType = -1;
  userTitle;

  constructor() {}

  ngOnInit() {
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
