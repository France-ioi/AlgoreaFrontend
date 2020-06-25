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
  selector: 'alg-input',
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

  @Output() change = new EventEmitter<any>();
  @Output() click = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {}

  ngOnChanges(_changes: SimpleChanges) {}

  onValueChange(e) {
    this.change.emit(e);
  }

  onButtonClick(e) {
    this.click.emit(e);
  }
}
