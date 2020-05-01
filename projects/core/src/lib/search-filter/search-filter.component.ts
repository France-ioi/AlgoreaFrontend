import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-search-filter',
  templateUrl: './search-filter.component.html',
  styleUrls: ['./search-filter.component.scss']
})
export class SearchFilterComponent implements OnInit {

  ranges = [30, 72];
  items = [
    {label: 'Partiel', value: 'partiel'},
    {label: 'Entire', value: 'entire'}
  ];
  selected = 0;
  showDropdown = false;
  showContent = false;
  yesNo = false;

  constructor() { }

  ngOnInit() {
  }

  toggleContent(e) {
    this.showContent = !this.showContent;
  }

  onItemSelect(e, i) {
    this.selected = i;
    this.showDropdown = false;
  }

  onSliderChange(e) {
    this.ranges = e.values;
  }

}
