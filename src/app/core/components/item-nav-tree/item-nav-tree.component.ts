import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { Router } from '@angular/router';
import * as _ from 'lodash-es';
import { Item } from '../../http-services/item-navigation.service';

// ItemTreeNode is PrimeNG tree node with data forced to be an item
interface ItemTreeNode extends TreeNode {
  data: Item
  target: string
}

@Component({
  selector: 'alg-item-nav-tree',
  templateUrl: './item-nav-tree.component.html',
  styleUrls: ['./item-nav-tree.component.scss']
})
export class ItemNavTreeComponent implements OnChanges {
  @Input() items: Item[] = [];

  // : Item[] = [
  //   {
  //     id: '26',
  //     title: 'Activities to test mosaic/list modes',
  //     type: 'folder',
  //     ring: true,
  //     state: 'never opened',
  //     progress: {
  //       displayedScore: 0,
  //       currentScore: 0
  //     },
  //     children: [
  //       {
  //         id: 42,
  //         title: 'Activity with session list',
  //         type: 'leaf',
  //         ring: true,
  //         state: 'opened',
  //         hasKey: true,
  //         progress: {
  //           displayedScore: 30,
  //           currentScore: 30
  //         },
  //         category: {
  //           icon: 'fa fa-book-open',
  //           type: 1
  //         }

  nodes: ItemTreeNode[];

  constructor(private router: Router) {}

  ngOnChanges(_changes: SimpleChanges) {
    this.nodes = _.map(this.items, (i) => {
      return {
        label: i.title,
        data: i,
        type:  i.hasChildren ? 'folder' : 'leaf',
        leaf: i.hasChildren,
        target: `/items/${i.id}`,
      };
    });
  }

  onSelect(_e, node: ItemTreeNode) {
    void this.router.navigate([node.target]);
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.stopPropagation();
      e.preventDefault();
      const element: HTMLElement = document.activeElement.querySelector(
        '.ui-treenode-label .node-tree-item > .node-item-content > .node-label'
      );
      element.click();
    } else if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
      e.stopPropagation();
      e.preventDefault();
      const element: HTMLElement = document.activeElement.querySelector(
        '.ui-treenode-label .node-tree-item > .node-item-content > .node-label'
      );
      element.scrollIntoView({
        behavior: 'auto',
        block: 'center',
      });
    }
  }

}
