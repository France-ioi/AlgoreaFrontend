import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss'],
})
export class DropdownComponent implements OnInit {
  @Input() items;
  @Input() selectedItem;
  @Input() placeholder;

  @Output() onChange = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {}

  handleChange(e) {
    this.onChange.emit(e);
  }
}
