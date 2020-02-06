import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class DialogComponent implements OnInit {

  @Input() show = false;
  @Input() icon;
  @Input() label;
  @Output() onHide = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit() {
  }

  hideEvent(e) {
    console.log(this.show);
    this.onHide.emit(this.show);
  }

}
