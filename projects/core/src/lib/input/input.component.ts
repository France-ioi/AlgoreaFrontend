import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

@Component({
  selector: 'lib-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
})
export class InputComponent implements OnInit, OnChanges {
  @Input() value;
  @Input() placeholder;
  @Input() icon;
  @Input() mode = 'dark';
  @Input() type = 'small';
  @Input() hasButton = false;
  @Input() inputType = 'text';
  @Input() leftIcon = 'fa fa-font';

  @Output() onChange = new EventEmitter<any>();
  @Output() onClick = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {}

  ngOnChanges(_changes: SimpleChanges) {}

  onValueChange(e) {
    this.onChange.emit(e);
  }

  onButtonClick(e) {
    this.onClick.emit(e);
  }
}
