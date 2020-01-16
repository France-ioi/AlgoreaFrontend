import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TreeNode } from 'primeng/api';

@Component({
  selector: 'app-tree-selection-dialog',
  templateUrl: './tree-selection-dialog.component.html',
  styleUrls: ['./tree-selection-dialog.component.css']
})
export class TreeSelectionDialogComponent implements OnInit, OnChanges {

  @Input() data: TreeNode[];

  constructor() {
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.data) {
      while(this.data.length > 1) {
        this.data.pop();
      }
      if (this.data.length > 0) {
        this.data[0]['root'] = true;
      }
    }
  }

  nodeExpand(event, node) {
    console.log(node);
    if (!node.expanded) {
      node.expanded = true;
    } else {
      node.expanded = false;
    }
  }

  nodeCheck(event, node) {
    if (!node.checked) {
      node.checked = true;
    } else {
      node.checked = false;
    }
  }

}
