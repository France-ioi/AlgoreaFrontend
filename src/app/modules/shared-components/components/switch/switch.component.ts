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
  styleUrls: ['./switch.component.scss'],
})
export class SwitchComponent implements OnInit, OnChanges {
  @Input() checked;
  @Input() mode: 'dark' | 'white' | 'circular' | 'dark-circular' = 'dark';
  @Input() type = 'square';

  @Output() change = new EventEmitter<boolean>();

  constructor() {}

  ngOnInit() {}

  ngOnChanges(_changes: SimpleChanges) {}

  handleChange(e) {
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */ /* primeng has no type on their events :-/ */
    this.change.emit(e.checked);
  }
}
