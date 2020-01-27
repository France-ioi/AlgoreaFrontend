import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-left-nav',
  templateUrl: './left-nav.component.html',
  styleUrls: ['./left-nav.component.scss']
})
export class LeftNavComponent implements OnInit {

  @Input() data;
  @Input() user;
  @Output() collapseEvent = new EventEmitter<boolean>();

  @Input() collapsed = false;

  constructor() { }

  ngOnInit() {
  }

  onCollapse(e) {
    this.collapsed = !this.collapsed;
    this.collapseEvent.emit(this.collapsed);
  }

}
