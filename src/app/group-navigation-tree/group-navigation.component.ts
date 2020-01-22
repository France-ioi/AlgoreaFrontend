import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TreeNode } from 'primeng/api';

@Component({
  selector: 'app-group-navigation-tree',
  templateUrl: './group-navigation-tree.component.html',
  styleUrls: ['./group-navigation-tree.component.scss']
})
export class GroupNavigationTreeComponent implements OnInit, OnChanges {

  @Input() data: TreeNode[];
  @Input() inGroup = false;

  constructor() {
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.data) {
      // while (this.data.length > 1) {
      //   this.data.pop();
      // }
      if (!this.inGroup && this.data.length > 0) {
        this.data[0]['root'] = true;
      }
    }
  }

  nodeExpand(event, node) {
    if (!node.expanded) {
      node.expanded = true;
    } else {
      node.expanded = false;
    }
  }

  _unCheckAll(nodes) {
    if (!nodes) {
      return;
    }

    nodes.forEach((node) => {
      node.checked = false;
      this._unCheckAll(node.children);
    });
  }

  nodeCheck(event, node) {
    this._unCheckAll(this.data);
    if (!node.checked) {
      node.checked = true;
    } else {
      node.checked = false;
    }
    
    node.expanded = true;
  }

}
