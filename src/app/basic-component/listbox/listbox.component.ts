import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-listbox',
  templateUrl: './listbox.component.html',
  styleUrls: ['./listbox.component.scss'],
})
export class ListboxComponent implements OnInit {
  @Input() items;
  @Output() change = new EventEmitter<any>();

  selectedItem;

  constructor() {}

  ngOnInit() {}

  itemSelect(e) {
    this.change.emit(e);
  }
}
