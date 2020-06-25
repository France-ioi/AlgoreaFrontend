import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'alg-search-input',
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss'],
})
export class SearchInputComponent implements OnInit {
  value = '';
  dirty = false;

  @Output() change = new EventEmitter<any>();
  @Output() close = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {}

  onIconClicked(e) {
    if (this.dirty) {
      this.value = '';
      this.dirty = false;
      this.close.emit(e);
    } else {
      this.dirty = true;
      this.change.emit('');
    }
  }

  onValueChange(e) {
    if (e.length > 0) {
      this.dirty = true;
    } else {
      this.dirty = false;
    }
    this.change.emit(e);
  }

  onFocus(_e) {
    this.change.emit('');
    this.dirty = true;
  }
}
