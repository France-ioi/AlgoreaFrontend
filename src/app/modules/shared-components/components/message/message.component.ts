import { Component, OnInit, Input } from '@angular/core';
import { Message } from 'primeng/api';

@Component({
  selector: 'alg-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnInit {

  @Input() type: 'success' | 'info' | 'error';
  @Input() label: string;
  @Input() closable = true;

  msgs : Message[] = [];

  constructor() { }

  ngOnInit() {
    this.msgs.push({
      severity: this.type,
      summary: '',
      detail: this.label
    });
  }

}
