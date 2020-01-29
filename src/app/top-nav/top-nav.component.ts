import { Component, OnInit, Output, EventEmitter, Input, HostListener } from '@angular/core';

@Component({
  selector: 'app-top-nav',
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.scss']
})
export class TopNavComponent implements OnInit {

  @Output() collapseEvent = new EventEmitter<boolean>();
  @Output() foldEvent = new EventEmitter<boolean>();

  @Input() collapsed = false;
  @Input() templateId = 0;
  @Input() folded = false;

  @Input() data;

  constructor() { }

  ngOnInit() {
  }

  onCollapse(e) {
    this.collapsed = !this.collapsed;
    this.collapseEvent.emit(this.collapsed);
  }

  onFold(e) {
    this.folded = !this.folded;
    this.foldEvent.emit(this.folded);
  }

}
