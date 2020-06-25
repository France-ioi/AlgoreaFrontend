import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  HostListener,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import * as converter from 'number-to-words';

@Component({
  selector: 'alg-group-header',
  templateUrl: './group-header.component.html',
  styleUrls: ['./group-header.component.scss'],
})
export class GroupHeaderComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() isScrolled;
  @Input() isFolded;
  @Input() isStarted;
  @Input() isCollapsed;
  @Input() data;

  @ViewChild('userInfo') userInfo;

  isTwoColumn = false;
  grades;
  visibleAssoc = true;

  constructor() {}

  ngOnInit() {
    if (Object.keys(this.data).length > 3) {
      this.isTwoColumn = true;
    }
  }

  ngAfterViewInit() {
    this.checkVisibility();
  }

  checkVisibility() {
    const html = document.getElementsByTagName('html')[0] as HTMLElement;
    const fontSize = window
      .getComputedStyle(html, null)
      .getPropertyValue('font-size');
    if (this.userInfo.nativeElement.offsetWidth / parseInt(fontSize, 10) <= 60) {
      this.visibleAssoc = false;
    } else {
      this.visibleAssoc = true;
    }
  }

  ngOnChanges(_changes: SimpleChanges) {
    if (this.data && this.data.grades) {
      this.grades = [];
      this.data.grades.forEach((grade) => {
        this.grades.push(converter.toWords(grade));
      });
    }
  }

  @HostListener('window:resize', ['$event'])
  onResized(_e) {
    this.checkVisibility();
  }

  onExpandWidth(_e) {}
}
