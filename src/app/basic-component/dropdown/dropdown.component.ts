import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'alg-dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss'],
})
export class DropdownComponent implements OnInit {
  @Input() items;
  @Input() selectedItem;
  @Input() placeholder;

  @Output() change = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {}

  handleChange(e) {
    this.change.emit(e);
  }
}
