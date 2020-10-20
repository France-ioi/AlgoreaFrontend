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
  @Input() name : string | number | null; // name of the input in the parent form

  @Input() placeholder = ''; // avoid 'undefined' if no placeholder specified
  @Input() icon: string;
  @Input() mode = 'dark';
  @Input() type = 'small';
  @Input() hasButton = false;
  @Input() inputType = 'text';
  @Input() leftIcon = 'fa fa-font';
  @Input() parentForm : FormGroup;

  @Output() click = new EventEmitter();

  constructor() {}

  ngOnInit() {}

  ngOnChanges(_changes: SimpleChanges) {}

  onButtonClick() {
    this.click.emit();
  }
}
