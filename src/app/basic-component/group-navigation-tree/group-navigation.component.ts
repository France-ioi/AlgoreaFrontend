import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-group-navigation-tree',
  templateUrl: './group-navigation-tree.component.html',
  styleUrls: ['./group-navigation-tree.component.scss']
})
export class GroupNavigationTreeComponent implements OnInit, OnChanges {

  @Input() data: TreeNode[];
  @Input() inGroup = false;

  @Output() onNodeChange = new EventEmitter<any>();
  @Output() onTitleChange = new EventEmitter<any>();

  constructor(
    private router: Router
  ) {}

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.data) {
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

  nodeCheck(e, node) {
    this._unCheckAll(this.data);
    if (!node.checked) {
      node.checked = true;
    } else {
      node.checked = false;
    }
    
    console.log();
    const segments = this.router.parseUrl(this.router.url).root.children.primary.segments;

    if (segments.length > 0 && segments[0].path === 'group') {
      this.onNodeChange.emit(node);
    } else {
      this.onTitleChange.emit(node);
    }
    node.expanded = true;
  }

  goToPage(e, node) {
    this.onNodeChange.emit(node);
  }

}
