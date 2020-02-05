import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss']
})
export class InputComponent implements OnInit {

  @Input() value;
  @Input() placeholder;
  @Input() icon;
  @Input() mode = 'dark';
  @Input() type = 'small';

  constructor() { }

  ngOnInit() {
  }

}
