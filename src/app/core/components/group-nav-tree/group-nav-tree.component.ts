import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Router } from '@angular/router';
import { Group } from '../../http-services/get-joined-groups.service';
import { TreeNode } from 'primeng/api';
import * as _ from 'lodash-es';

// GroupTreeNode is PrimeNG tree node with data forced to be a group
interface GroupTreeNode extends TreeNode {
  data: Group
  target: string
}

@Component({
  selector: 'alg-group-nav-tree',
  templateUrl: './group-nav-tree.component.html',
  styleUrls: ['./group-nav-tree.component.scss'],
})
export class GroupNavTreeComponent implements OnChanges {
  @Input() groups: Group[] = [];

  nodes: GroupTreeNode[];

  constructor(private router: Router) {}

  ngOnChanges(_changes: SimpleChanges) {
    this.nodes = _.map(this.groups, (g) => {
      return {
        label: g.name,
        data: g,
        type: 'leaf',
        leaf: true,
        target: `/groups/details/${g.id}`,
      };
    });
  }

  onSelect(_e, node: GroupTreeNode) {
    void this.router.navigate([node.target]);
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.stopPropagation();
      e.preventDefault();
      const element: HTMLElement = document.activeElement.querySelector(
        '.ui-treenode-label .node-tree-item > .node-item-content > .node-label > .node-label-title'
      );
      element.click();
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
