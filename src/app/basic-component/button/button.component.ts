import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'alg-button',
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
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */ /* primeng has no type on their events :-/ */
    /* eslint-disable @typescript-eslint/no-unsafe-call */
    e.stopPropagation();
    this.click.emit(e);
  }
}
