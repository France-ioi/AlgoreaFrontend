import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-yourself-header',
  templateUrl: './yourself-header.component.html',
  styleUrls: ['./yourself-header.component.scss']
})
export class YourselfHeaderComponent implements OnInit {

  @Input() isScrolled;
  @Input() isFolded;
  @Input() isStarted;
  @Input() isCollapsed;

  constructor() { }

  ngOnInit() {
  }

}
