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
  selector: 'app-items-navigation-tree',
  templateUrl: './items-navigation-tree.component.html',
  styleUrls: ['./items-navigation-tree.component.scss'],
})
export class ItemsNavigationTreeComponent implements OnInit, OnChanges {
  @Input() data = [];

  // tslint:disable-next-line: no-output-on-prefix
  @Output() onNodeExpand = new EventEmitter<any>();
  // tslint:disable-next-line: no-output-on-prefix
  @Output() onNodeSelect = new EventEmitter<any>();

  @ViewChild('navTree', { static: false }) navTree;

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

  nodeExpand(_event, node) {
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

  nodeCheck(_event, node) {
    this._unCheckAll(this.data);
    node.checked = true;

    node.expanded = true;
    this.onNodeSelect.emit(node);
  }

  nodeSelect(_e) {}

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
