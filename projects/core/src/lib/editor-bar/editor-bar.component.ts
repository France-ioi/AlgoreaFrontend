import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'lib-editor-bar',
  templateUrl: './editor-bar.component.html',
  styleUrls: ['./editor-bar.component.scss'],
})
export class EditorBarComponent implements OnInit {
  @Output() onCancel = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {}

  discardChanges(e) {
    this.onCancel.emit(e);
  }
}
