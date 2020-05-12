import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'lib-group-button',
  templateUrl: './group-button.component.html',
  styleUrls: ['./group-button.component.scss'],
})
export class GroupButtonComponent implements OnInit {
  @Input() label;
  @Input() icon;
  @Input() disabled = false;

  @Output() onClick = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {}

  onClickEvent(e) {
    this.onClick.emit(e);
  }
}
