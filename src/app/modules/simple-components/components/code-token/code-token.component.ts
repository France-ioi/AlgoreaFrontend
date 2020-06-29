import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'alg-code-token',
  templateUrl: './code-token.component.html',
  styleUrls: ['./code-token.component.scss'],
})
export class CodeTokenComponent implements OnInit {
  @Input() showRefresh = true;
  @Input() showRemove = false;
  @Input() code = '...';

  @Output() refresh = new EventEmitter<void>();
  @Output() remove = new EventEmitter<void>();

  constructor() {}

  ngOnInit() {}

  refreshCode(_e) {
    this.refresh.emit();
  }

  removeCode(_e) {
    this.remove.emit();
  }
}
