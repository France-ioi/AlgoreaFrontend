import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-switch',
  templateUrl: './switch.component.html',
  styleUrls: ['./switch.component.scss']
})
export class SwitchComponent implements OnInit, OnChanges {

  @Input() checked = false;
  @Input() isDark = 'true';

  // tslint:disable-next-line: no-output-on-prefix
  @Output() onChange = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {

  }

  handleChange(e) {
    this.onChange.emit(this.checked);
  }

}
