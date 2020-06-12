import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss'],
})
export class MessageComponent implements OnInit {
  @Input() type;
  @Input() label;
  @Input() closable = true;

  msgs = [];

  constructor() {}

  ngOnInit() {
    this.msgs.push({
      severity: this.type,
      summary: '',
      detail: this.label,
    });
  }
}
