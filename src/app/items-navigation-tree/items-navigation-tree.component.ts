import {
  Component,
  OnInit,
  OnChanges,
  Input,
  SimpleChanges,
  Output,
  EventEmitter
} from '@angular/core';
import { TreeNode } from 'primeng/api';

@Component({
  selector: 'app-items-navigation-tree',
  templateUrl: './items-navigation-tree.component.html',
  styleUrls: ['./items-navigation-tree.component.scss']
})
export class ItemsNavigationTreeComponent implements OnInit, OnChanges {
  @Input() data: TreeNode[];

  @Output() onNodeExpand = new EventEmitter<any>();
  spread = [];

  constructor() {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (this.data) {
      this.data.forEach(item => {
        item['root'] = true;
      });
      this.spread.length = 0;
      this.dfs(this.data);
    }
  }

  nodeExpand(event, node) {
    if (!node.expanded) {
      node.expanded = true;
    } else {
      node.expanded = false;
    }
    this.onNodeExpand.emit(node);
  }

  _unCheckAll(nodes) {
    if (!nodes) {
      return;
    }

    nodes.forEach(node => {
      node.checked = false;
      node.selectedTop = false;
      node.selectedBottom = false;
      this._unCheckAll(node.children);
    });
  }

  dfs(nodes) {
    if (!nodes) {
      return;
    }

    nodes.forEach(node => {
      this.spread.push(node);
      this.dfs(node.children);
    });
  }

  nodeCheck(event, node) {
    this._unCheckAll(this.data);
    node.checked = true;

    node.expanded = true;
  }
}
