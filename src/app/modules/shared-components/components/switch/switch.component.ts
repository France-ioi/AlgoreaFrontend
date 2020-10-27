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
  selector: 'alg-switch',
  templateUrl: './switch.component.html',
  styleUrls: [ './switch.component.scss' ],
})
export class SwitchComponent implements OnInit, OnChanges {
  @Input() checked = false;
  @Input() mode: 'dark' | 'white' | 'circular' | 'dark-circular' = 'dark';
  @Input() type = 'square';

  @Output() change = new EventEmitter<boolean>();

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(_changes: SimpleChanges): void {}

  handleChange(checked: boolean): void {
    this.change.emit(checked);
  }
}
