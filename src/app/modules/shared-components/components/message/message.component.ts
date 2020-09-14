import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'alg-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnInit {

  @Input() type: string;
  @Input() label: string;
  @Input() closable = true;

  msgs = [];

  constructor() { }

  ngOnInit() {
    /*
    this.msgs.push({
      severity: this.type,
      summary: '',
      detail: this.label
    });
    */
  }

}
