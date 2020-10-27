import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

interface Node {
  root: boolean
  expanded: boolean
  checked: boolean
}

@Component({
  selector: 'alg-selection-tree',
  templateUrl: './selection-tree.component.html',
  styleUrls: [ './selection-tree.component.scss' ],
})
export class SelectionTreeComponent implements OnInit, OnChanges {
  @Input() data: Node[] = [];

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

  nodeExpand(node: Node) {
    if (!node.expanded) {
      node.expanded = true;
    } else {
      node.expanded = false;
    }
  }

  nodeCheck(node: Node) {
    if (!node.checked) {
      node.checked = true;
    } else {
      node.checked = false;
    }
  }
}
