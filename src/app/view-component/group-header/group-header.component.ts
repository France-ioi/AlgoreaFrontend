import { Component, OnInit, Input, OnChanges, SimpleChanges, HostListener, ViewChild } from '@angular/core';
import * as converter from 'number-to-words';

@Component({
  selector: 'app-group-header',
  templateUrl: './group-header.component.html',
  styleUrls: ['./group-header.component.scss']
})
export class GroupHeaderComponent implements OnInit, OnChanges {

  @Input() isScrolled;
  @Input() isFolded;
  @Input() isStarted;
  @Input() isCollapsed;
  @Input() data;

  @ViewChild('userInfo', { static: false }) userInfo;

  isTwoColumn = false;
  grades;
  visibleAssoc = true;

  constructor() { }

  ngOnInit() {
    if (Object.keys(this.data).length > 3) {
      this.isTwoColumn = true;
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
    console.log(this.userInfo);
    if (this.userInfo.nativeElement.offsetWidth <= 650) {
      this.visibleAssoc = false;
    } else {
      this.visibleAssoc = true;
    }
  }

}
