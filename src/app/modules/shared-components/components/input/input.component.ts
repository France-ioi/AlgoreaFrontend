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
  @Input() value: string;
  @Input() placeholder: string;
  @Input() icon: string;
  @Input() mode = 'dark';
  @Input() type = 'small';
  @Input() hasButton = false;
  @Input() inputType = 'text';
  @Input() leftIcon = 'fa fa-font';

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
