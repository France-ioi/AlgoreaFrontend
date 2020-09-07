import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'alg-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
})
export class ButtonComponent implements OnInit {
  @Input() label: string;
  @Input() disabled = false;
  @Input() icon: string;
  @Input() class: string;
  @Input() iconPos = 'left';

  @Output() click = new EventEmitter<void>();

  constructor() {}

  ngOnInit() {}

  onClickEvent(event: any) {
    (event as Event).stopPropagation();
    this.click.emit();
  }
}
