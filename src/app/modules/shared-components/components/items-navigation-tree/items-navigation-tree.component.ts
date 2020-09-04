/* eslint-disable */ /* FIXME disabled for now while this is the mockup code, to be removed afterwards */
import {
  Component,
  OnInit,
  OnChanges,
  Input,
  SimpleChanges,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'alg-items-navigation-tree',
  templateUrl: './items-navigation-tree.component.html',
  styleUrls: ['./items-navigation-tree.component.scss'],
})
export class ItemsNavigationTreeComponent implements OnInit, OnChanges {
  @Input() data = [];

  @Output() nodeExpand = new EventEmitter<any>();
  @Output() nodeSelect = new EventEmitter<any>();

  @ViewChild('navTree') navTree;

  spread = [];

  constructor() {}

  ngOnInit() {}

  ngOnChanges(_changes: SimpleChanges) {
    if (this.data) {
      this.data.forEach((item) => {
        item.root = true;
      });
      this.spread.length = 0;
      this.dfs(this.data);
    }
  }

  onNodeExpand(node) {
    if (!node.expanded) {
      node.expanded = true;
    } else {
      node.expanded = false;
    }
    this.nodeExpand.emit(node);
  }

  _unCheckAll(nodes) {
    if (!nodes) {
      return;
    }

    nodes.forEach((node) => {
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

    nodes.forEach((node) => {
      this.spread.push(node);
      this.dfs(node.children);
    });
  }

  nodeCheck(node) {
    this._unCheckAll(this.data);
    node.checked = true;

    node.expanded = true;
    this.nodeSelect.emit(node);
  }

  onKeyDown(e) {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.stopPropagation();
      e.preventDefault();
      const element = document.activeElement.querySelector(
        '.ui-treenode-label .node-tree-item > .node-item-content > .node-label'
      ) as HTMLElement;
      element.click();
    } else if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
      e.stopPropagation();
      e.preventDefault();
      const element = document.activeElement.querySelector(
        '.ui-treenode-label .node-tree-item > .node-item-content > .node-label'
      ) as HTMLElement;
      element.scrollIntoView({
        behavior: 'auto',
        block: 'center',
      });
    }
  }
}
