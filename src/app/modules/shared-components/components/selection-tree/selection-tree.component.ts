/* eslint-disable */ /* FIXME disabled for now while this is the mockup code, to be removed afterwards */
import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

@Component({
  selector: 'alg-selection-tree',
  templateUrl: './selection-tree.component.html',
  styleUrls: ['./selection-tree.component.scss'],
})
export class SelectionTreeComponent implements OnInit, OnChanges {
  @Input() data = [];

  constructor() {}

  ngOnInit() {}

  ngOnChanges(_changes: SimpleChanges) {
    if (this.data) {
      while (this.data.length > 1) {
        this.data.pop();
      }
      if (this.data.length > 0) {
        this.data[0].root = true;
        this.data[0].expanded = true;
      }
    }
  }

  nodeExpand(_event, node) {
    if (!node.expanded) {
      node.expanded = true;
    } else {
      node.expanded = false;
    }
  }

  nodeCheck(_event, node) {
    if (!node.checked) {
      node.checked = true;
    } else {
      node.checked = false;
    }
  }
}
