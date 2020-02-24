import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-rating-bar',
  templateUrl: './rating-bar.component.html',
  styleUrls: ['./rating-bar.component.scss']
})
export class RatingBarComponent implements OnInit {

  selected = [
    false, false, false
  ];

  constructor() { }

  ngOnInit() {
  }

  onSelectItem(idx) {
    this.selected[idx] = !this.selected[idx];
  }

}
