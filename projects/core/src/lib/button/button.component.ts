import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
})
export class ButtonComponent implements OnInit {
  @Input() label;
  @Input() disabled = false;
  @Input() icon;
  @Input() class;
  @Input() iconPos = 'left';

  @Output() click = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {}

  onClickEvent(e) {
    e.stopPropagation();
    this.click.emit(e);
  }
}
