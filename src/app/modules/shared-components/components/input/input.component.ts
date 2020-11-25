import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'alg-input',
  templateUrl: './input.component.html',
  styleUrls: [ './input.component.scss' ],
})
export class InputComponent implements OnInit, OnChanges {
  @Input() name = ''; // name of the input in the parent form
  @Input() parentForm?: FormGroup;

  @Input() placeholder = ''; // avoid 'undefined' if no placeholder specified
  @Input() isDark = true;
  @Input() size: 'small' | 'large' = 'small';
  @Input() inputType = 'text';
  @Input() inputIcon = 'font'; // a font-awesome icon identifier
  @Input() buttonIcon?: string; // a font-awesome icon identifier for the input button

  @Output() click = new EventEmitter();

  control: AbstractControl | null = null;

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.name || !this.parentForm) return;
    this.control = this.parentForm.get(this.name);
  }

  onButtonClick(): void {
    this.click.emit();
  }

  clearInput(): void {
    this.parentForm?.get(this.name)?.reset('');
  }
}
