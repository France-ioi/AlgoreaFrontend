import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'alg-group-button',
  templateUrl: './group-button.component.html',
  styleUrls: ['./group-button.component.scss'],
})
export class GroupButtonComponent implements OnInit {
  @Input() label;
  @Input() icon;
  @Input() disabled = false;

  @Output() click = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {}

  onClickEvent(e) {
    this.click.emit(e);
  }
}
