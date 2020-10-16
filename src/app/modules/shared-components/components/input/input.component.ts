import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'alg-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
})
export class InputComponent implements OnInit, OnChanges {
  @Input() value: string;
  @Input() placeholder = ''; // avoid 'undefined' if no placeholder specified
  @Input() icon: string;
  @Input() mode = 'dark';
  @Input() type = 'small';
  @Input() hasButton = false;
  @Input() inputType = 'text';
  @Input() leftIcon = 'fa fa-font';
  @Input() name : string | number | null;
  @Input() parentForm : FormGroup = new FormGroup(name);

  @Output() change = new EventEmitter<string>();
  @Output() click = new EventEmitter();

  constructor() {}

  ngOnInit() {}

  ngOnChanges(_changes: SimpleChanges) {}

  onValueChange(newValue: string) {
    this.change.emit(newValue);
  }

  onButtonClick() {
    this.click.emit();
  }
}
