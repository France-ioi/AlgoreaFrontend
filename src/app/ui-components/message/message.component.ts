import { Component, OnChanges, Input, SimpleChanges } from '@angular/core';
import { Message } from 'primeng/api';
import { MessagesModule } from 'primeng/messages';

@Component({
  selector: 'alg-message',
  templateUrl: './message.component.html',
  styleUrls: [ './message.component.scss' ],
  standalone: true,
  imports: [ MessagesModule ]
})
export class MessageComponent implements OnChanges {

  @Input() type: 'success' | 'info' | 'error' = 'info';
  @Input() summary?: string;
  @Input() detail = '';
  @Input() closable = true;

  msgs : Message[] = [];

  constructor() { }

  ngOnChanges(_changes: SimpleChanges): void {
    this.msgs = [{
      severity: this.type,
      summary: this.summary,
      detail: this.detail
    }];
  }
}
