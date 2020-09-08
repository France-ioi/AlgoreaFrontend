import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { NavMenuItem } from '../../http-services/item-navigation.service';
import { ResultActionsService } from 'src/app/shared/http-services/result-actions.service';
import { of, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NavItem, itemDetailsRoute } from 'src/app/shared/services/nav-types';
import { Router } from '@angular/router';

// ItemTreeNode is PrimeNG tree node with data forced to be an item
interface ItemTreeNode extends TreeNode {
  data: NavMenuItem
  itemPath: string[]
  status: 'ready'|'loading'|'error'
  checked: boolean,
}

@Component({
  selector: 'alg-item-nav-tree',
  templateUrl: './item-nav-tree.component.html',
  styleUrls: ['./item-nav-tree.component.scss']
})
export class ItemNavTreeComponent implements OnChanges {
  @Input() parent?: NavMenuItem;
  @Input() items: NavMenuItem[] = [];
  @Input() pathToItems: string[] = [];
  @Input() selectedItem?: NavItem;

  nodes: ItemTreeNode[];
  selectedNode: ItemTreeNode|null;

  constructor(
    private router: Router,
    private resultActionsService: ResultActionsService,
  ) {}

  mapItemToNodes(items: NavMenuItem[], pathToItems: string[], selectedItem?: NavItem): ItemTreeNode[] {
    return items.map((i) => {
      const isSelected = selectedItem && selectedItem.itemId === i.id;
      const shouldShowChildren = i.hasChildren && isSelected;
      const isLoadingChildren = shouldShowChildren && !i.children; // are being loaded by the parent component
      const showChildren = shouldShowChildren && !!i.children;
      const pathToChildren = pathToItems.concat([i.id]);
      return {
        label: i.title,
        data: i,
        itemPath: pathToItems,
        type: i.hasChildren ? 'folder' : 'leaf',
        leaf: i.hasChildren,
        status: isLoadingChildren ? 'loading' : 'ready',
        children: showChildren ? this.mapItemToNodes(i.children, pathToChildren, selectedItem) : undefined,
        expanded: showChildren,
        checked: isSelected,
      };
    });
  }

  ngOnChanges(_changes: SimpleChanges) {
    this.nodes = this.mapItemToNodes(this.items, this.pathToItems, this.selectedItem);
  }

  navigateToNode(node: ItemTreeNode, attemptId?: string) {
    void this.router.navigate(itemDetailsRoute({
      itemId: node.data.id,
      itemPath: node.itemPath,
      attemptId: attemptId,
      parentAttemptId: attemptId ? undefined : (node.parent ? (node.parent as ItemTreeNode).data.attemptId : this.parent.attemptId),
    }));
  }

  navigateToParent() {
    if (!this.parent) return; // unexpected!
    void this.router.navigate(itemDetailsRoute({
      itemId: this.parent.id,
      itemPath: this.pathToItems.slice(0, -1),
      attemptId: this.parent.attemptId,
    }));
  }

  selectNode(node: ItemTreeNode) {
    this.selectedNode = node;

    // do not allow re-selecting a node with fetching in progress
    if (node.status === 'loading') return;

    // if it is a leaf node, just navigate to it. the item-nav component will rearrange the tree if needed.
    if (!node.data.hasChildren) { // leaf
      this.navigateToNode(node, node.data.attemptId === null ? undefined : node.data.attemptId);
      return;
    }

    // Otherwise, the node has children: start a result (if not done yet), navigate and load children
    node.status = 'loading';
    this.startResultIfRequired(node).subscribe({
      next: (attemptId) => {
        if (this.selectedNode === node) {
          // if the node is not selected anymore after result start, do not navigate to it
          this.navigateToNode(node, attemptId);
        }
      },
      error: (_error) => {
        node.status = 'error';
        /* should handle error somehow */
      },
      complete: () => {
        node.status = 'ready';
      }
    });
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
    return this.nodes.some((n) => n.data.id === node.data.id);
  }

  /**
   * Start a new result only if the node does not have a result started yet
   */
  startResultIfRequired(node: ItemTreeNode): Observable<string> { // observable of attempt_id
    let attemptId = node.data.attemptId;
    if (attemptId === null) {
      attemptId = '0';
      return this.resultActionsService
        .start(node.itemPath.concat([node.data.id]), attemptId)
        .pipe(
          map(() => attemptId)
        );
    } else {
      return of(attemptId);
    }
  }

}
