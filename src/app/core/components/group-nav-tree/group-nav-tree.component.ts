/* eslint-disable */ /* FIXME disabled for now while this is the mockup code, to be removed afterwards */
import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'alg-group-nav-tree',
  templateUrl: './group-nav-tree.component.html',
  styleUrls: ['./group-nav-tree.component.scss'],
})
export class GroupNavTreeComponent implements OnInit, OnChanges {
  @Input() data = [];
  @Input() inGroup = false;
  @Input() navigation = true;
  @Input() showCategory = true;

  @Output() nodeChange = new EventEmitter<any>();
  @Output() titleChange = new EventEmitter<any>();
  @Output() editPage = new EventEmitter<any>();

  @ViewChild('groupTree') groupTree;

  constructor(private router: Router) {}

  ngOnInit() {}

  ngOnChanges(_changes: SimpleChanges) {
    if (this.data) {
      if (!this.inGroup && this.data.length > 0) {
        this.data[0].root = true;
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

  _unCheckAll(nodes) {
    if (!nodes) {
      return;
    }

    nodes.forEach((node) => {
      node.checked = false;
      this._unCheckAll(node.children);
    });
  }

  nodeCheck(_e, node) {
    this._unCheckAll(this.data);
    if (!node.checked) {
      node.checked = true;
    } else {
      node.checked = false;
    }

    const primaryChildren = this.router.parseUrl(this.router.url).root.children.primary;
    if (primaryChildren && primaryChildren.segments.length > 0 && primaryChildren.segments[0].path === 'group') {
      this.nodeChange.emit(node);
    } else {
      this.titleChange.emit(node);
    }
    node.expanded = true;
  }

  goToPage(_e, node) {
    this.nodeChange.emit(node);
  }

  toggleConnection(e, node) {
    e.stopPropagation();

    if (!node.connected) {
      node.connected = true;
    } else {
      node.connected = false;
    }
  }

  onGotoEditPage(node) {
    this.editPage.emit(node);
  }

  onKeyDown(e) {
    if (e.code === 'Space') {
      e.stopPropagation();
      e.preventDefault();
      const element = document.activeElement.querySelector(
        '.ui-treenode-label .node-tree-item > .node-item-content > .node-label > .node-label-title'
      ) as HTMLElement;
      element.click();
    } else if (e.code === 'Enter') {
      e.stopPropagation();
      e.preventDefault();
      const element = document.activeElement.querySelector(
        '.ui-treenode-label .node-tree-item > .node-item-content > .node-label > .node-label-title'
      ) as HTMLElement;
      element.click();
      setTimeout(() => {
        const gotoElement = document.activeElement.querySelector(
          '.ui-treenode-label .node-tree-item > .node-item-content > .go-to-page'
        ) as HTMLElement;
        gotoElement.click();
      }, 0);
    } else if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
      e.stopPropagation();
      e.preventDefault();
      const element = document.activeElement as HTMLElement;

      if (element) {
        element.scrollIntoView({
          behavior: 'auto',
          block: 'center',
        });
      }
    }
  }
}
