import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'alg-editor-bar',
  templateUrl: './editor-bar.component.html',
  styleUrls: ['./editor-bar.component.scss'],
})
export class EditorBarComponent implements OnInit {
  @Output() cancel = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {}

  discardChanges(e) {
    this.cancel.emit(e);
  }
}
