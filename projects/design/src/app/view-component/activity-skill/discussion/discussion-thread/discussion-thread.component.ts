import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-discussion-thread',
  templateUrl: './discussion-thread.component.html',
  styleUrls: ['./discussion-thread.component.scss']
})
export class DiscussionThreadComponent implements OnInit {

  @Input() label;
  @Input() threads;
  @Input() answer;
  @Input() message;

  @Output() onClose = new EventEmitter<any>();

  constructor() { }

  ngOnInit() {
  }

  onBack(e) {
    this.onClose.emit(e);
  }

}
