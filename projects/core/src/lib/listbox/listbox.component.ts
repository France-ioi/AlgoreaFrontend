import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'lib-listbox',
  templateUrl: './listbox.component.html',
  styleUrls: ['./listbox.component.scss'],
})
export class ListboxComponent implements OnInit {
  @Input() items;
  @Output() onChange = new EventEmitter<any>();

  selectedItem;

  constructor() {}

  ngOnInit() {}

  itemSelect(e) {
    this.onChange.emit(e);
  }
}
