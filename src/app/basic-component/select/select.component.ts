import { Component, OnInit, Input, ElementRef, HostListener } from '@angular/core';

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss']
})
export class SelectComponent implements OnInit {

  @Input() items;
  @Input() width = 75;
  @Input() opened = false;
  
  selected;

  constructor() { }

  ngOnInit() {
    this.selected = this.items[0];
  }

  toogleDropdown(e) {
    this.opened = true;
    e.stopPropagation();
    console.log('Toggle Dropdown', this.opened);
  }

  hideDropdown(e) {
    this.opened = false;
    console.log('Hide Dropdown', this.opened);
  }

  selectValue(e) {
    this.selected = e;
    this.opened = false;
  }

}
