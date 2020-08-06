import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { Router } from '@angular/router';
import * as _ from 'lodash-es';
import { Item, ItemNavigationService, MenuItems } from '../../http-services/item-navigation.service';
import { ResultActionsService } from 'src/app/shared/http-services/result-actions.service';
import { of, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

// ItemTreeNode is PrimeNG tree node with data forced to be an item
interface ItemTreeNode extends TreeNode {
  data: Item
  target: string
}

function itemsToTreeNodes(items: Item[]): ItemTreeNode[] {
  return _.map(items, (i) => {
    return {
      label: i.title,
      data: i,
      type:  i.hasChildren ? 'folder' : 'leaf',
      leaf: i.hasChildren,
      target: `/items/details/${i.id}`,
    };
  });
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

  constructor(
    private router: Router,
    private resultActionsService: ResultActionsService,
    private itemNavService: ItemNavigationService,
  ) {}

  ngOnChanges(_changes: SimpleChanges) {
    this.nodes = itemsToTreeNodes(this.items);
  }

  onSelect(_e, node: ItemTreeNode) {
    void this.router.navigate([node.target]);
    if (this.isFirstLevelNode(node)) {
      // if it is a first level node, expand it without changing the root of the menu.
      // require to create an attempt if the participant has no attempt on this item
      this.createAttemptIfNoneDefined(node).pipe(
        switchMap( (attemptId) =>  this.itemNavService.getNavData(node.data.id, attemptId) )
      ).subscribe(
        (data: MenuItems) => {
          // TODO: update parent
          node.children = itemsToTreeNodes(data.children);
          node.expanded = true;
        },
        (_error) => { /* should handle error somehow */ }
      );
    }
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

  /**
   * Return whether the given node is at the first level of the displayed tree (root) (i.e. is not a children)
   */
  isFirstLevelNode(node: ItemTreeNode): boolean {
    return _.some(this.nodes, (n) => n.data.id === node.data.id);
  }

  createAttemptIfNoneDefined(node: ItemTreeNode): Observable<string> { // observable of attempt_id
    let attemptId = node.data.attemptId;
    if (attemptId === null) {
      attemptId = '0';
      return this.resultActionsService
        .start([node.data.id], attemptId)
        .pipe(
          map(() => attemptId)
        );
    } else {
      return of(attemptId);
    }
  }

}
