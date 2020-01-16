import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TreeNode } from 'primeng/api';

@Component({
  selector: 'app-group-navigation',
  templateUrl: './group-navigation.component.html',
  styleUrls: ['./group-navigation.component.css']
})
export class GroupNavigationComponent implements OnInit, OnChanges {

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
