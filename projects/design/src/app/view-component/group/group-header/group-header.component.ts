import { Component, OnInit, Input, OnChanges, SimpleChanges, HostListener, ViewChild, AfterViewInit } from '@angular/core';
import * as converter from 'number-to-words';

@Component({
  selector: 'app-group-header',
  templateUrl: './group-header.component.html',
  styleUrls: ['./group-header.component.scss']
})
export class GroupHeaderComponent implements OnInit, OnChanges, AfterViewInit {

  @Input() isScrolled;
  @Input() isFolded;
  @Input() isStarted;
  @Input() isCollapsed;
  @Input() data;

  @ViewChild('userInfo') userInfo;

  ID;

  isTwoColumn = false;
  grades;
  visibleAssoc = true;

  gradingRequests = [
    {
      user: 'BorisKarlo',
      subject: 'LoremIpsum'
    },
    {
      user: 'PaulGogo',
      subject: 'LoremIpsum'
    },
    {
      user: 'Marionduv',
      subject: 'LoremIpsum'
    },
    {
      user: 'Bestof',
      subject: 'LoremIpsum'
    },
    {
      user: 'SimSim',
      subject: 'LoremIpsum'
    },
    {
      user: 'Mamaschmitt',
      subject: 'LoremIpsum'
    }
  ];

  rightsReminder = {
    administrators: [
      'Mathias HIRON',
      'Melanie STORUP',
      'Jean LUCAS'
    ],
    require_watch_approval: true,
    require_personal_info_access_approval: 'edit',
    require_lock_membership_approval_until: new Date(),
    desc: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.'
  };

  constructor() { }

  ngOnInit() {
    if (Object.keys(this.data).length > 3) {
      this.isTwoColumn = true;
    }
    this.ID = this.data.ID;
  }

  ngAfterViewInit() {
    this.checkVisibility();
  }

  checkVisibility() {
    const html = document.getElementsByTagName('html')[0] as HTMLElement;
    const fontSize = window.getComputedStyle(html, null).getPropertyValue('font-size');
    if (this.userInfo.nativeElement.offsetWidth / parseInt(fontSize, 10) <= 60) {
      this.visibleAssoc = false;
    } else {
      this.visibleAssoc = true;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.data) {
      this.grades = [];
      this.data.grades.forEach(grade => {
        this.grades.push(converter.toWords(grade));
      });
    }
  }

  @HostListener('window:resize', ['$event'])
  onResized(e) {
    this.checkVisibility();
  }

  onExpandWidth(e) {

  }

}
