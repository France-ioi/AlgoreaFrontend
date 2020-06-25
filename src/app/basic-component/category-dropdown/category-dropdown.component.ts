import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'alg-category-dropdown',
  templateUrl: './category-dropdown.component.html',
  styleUrls: ['./category-dropdown.component.scss'],
})
export class CategoryDropdownComponent implements OnInit {
  @Input() current = 0;

  types = [
    { label: 'discovery', value: 0 },
    { label: 'practice', value: 1 },
    { label: 'validation', value: 2 },
    { label: 'challenge', value: 3 },
    { label: 'review', value: 4 },
  ];

  constructor() {}

  ngOnInit() {}

  handleChange(_e) {}
}
