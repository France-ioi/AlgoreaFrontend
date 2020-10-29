import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { NavMenuItem } from '../../http-services/item-navigation.service';
import { ResultActionsService } from 'src/app/shared/http-services/result-actions.service';
import { of, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ItemNavMenuData } from '../../common/item-nav-menu-data';
import { itemDetailsUrl } from 'src/app/shared/helpers/item-route';

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
  styleUrls: [ './item-nav-tree.component.scss' ]
})
export class ItemNavTreeComponent implements OnChanges {
  @Input() data?: ItemNavMenuData;

  nodes: ItemTreeNode[] = [];
  selectedNode?: ItemTreeNode; // used to keep track after request that the selected is still the expected one

  constructor(
    private router: Router,
    private resultActionsService: ResultActionsService,
  ) {}

  mapItemToNodes(data: ItemNavMenuData): ItemTreeNode[] {
    return data.elements.map(i => {
      const isSelected = !!(data.selectedElement && data.selectedElement.id === i.id);
      const shouldShowChildren = i.hasChildren && isSelected;
      const isLoadingChildren = shouldShowChildren && !i.children; // are being loaded by the parent component
      const pathToChildren = data.pathToElements.concat([ i.id ]);
      return {
        label: i.title,
        data: i,
        itemPath: data.pathToElements,
        type: i.hasChildren ? 'folder' : 'leaf',
        leaf: i.hasChildren,
        status: isLoadingChildren ? 'loading' : 'ready',
        children: shouldShowChildren && i.children ? this.mapItemToNodes(new ItemNavMenuData(i.children, pathToChildren)) : undefined,
        expanded: !!(shouldShowChildren && i.children),
        checked: isSelected,
      };
    });
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.nodes = this.data ? this.mapItemToNodes(this.data) : [];
  }

  navigateToNode(node: ItemTreeNode, attemptId?: string): void {
    const routeBase = { id: node.data.id, path: node.itemPath };
    if (attemptId) {
      void this.router.navigate(itemDetailsUrl({ ...routeBase, attemptId: attemptId }));
      return;
    }
    const parentAttemptId = this.parentAttemptForNode(node);
    if (!parentAttemptId) return; // unexpected
    void this.router.navigate(itemDetailsUrl({ ...routeBase, parentAttemptId: parentAttemptId }));
  }

  navigateToParent(): void {
    if (!this.data?.parent?.attemptId) return; // unexpected!
    void this.router.navigate(itemDetailsUrl({
      id: this.data.parent.id,
      path: this.data.pathToElements.slice(0, -1),
      attemptId: this.data.parent.attemptId,
    }));
  }

  selectNode(node: ItemTreeNode): void {
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
      next: attemptId => {
        // as result has just been started, assume the score of the given attempt is 0
        node.data.attemptId = attemptId;
        node.data.score = { best: 0, current: 0, validated: false };
        if (this.selectedNode === node) {
          // if the node is not selected anymore after result start, do not navigate to it
          this.navigateToNode(node, attemptId);
        }
      },
      error: _error => {
        node.status = 'error';
        /* should handle error somehow */
      },
      complete: () => {
        node.status = 'ready';
      }
    });
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.stopPropagation();
      e.preventDefault();
      document.activeElement
        ?.querySelector<HTMLElement>('.ui-treenode-label .node-tree-item > .node-item-content > .node-label')
        ?.click();
    } else if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
      e.stopPropagation();
      e.preventDefault();
      document.activeElement
        ?.querySelector('.ui-treenode-label .node-tree-item > .node-item-content > .node-label')
        ?.scrollIntoView({
          behavior: 'auto',
          block: 'center',
        });
    }
  }

  /**
   * Return whether the given node is at the first level of the displayed tree (root) (i.e. is not a children)
   */
  isFirstLevelNode(node: ItemTreeNode): boolean {
    return this.nodes.some(n => n.data.id === node.data.id);
  }

  /**
   * Return the parent attemp id of this node.
   * If the node is a one of the "root" items, use this.parent
   * Otherwise use the parent node.
   * In a regular case, this function should never return 'undefined'
   */
  parentAttemptForNode(node: ItemTreeNode): string|undefined {
    if (node.parent) {
      const parent = node.parent as ItemTreeNode;
      return parent.data.attemptId || undefined /* unexpected */;
    } else if (this.data?.parent) {
      return this.data.parent.attemptId || undefined /* unexpected */;
    }
    return undefined /* unexpected */;
  }

  /**
   * Start a new result only if the node does not have a result started yet
   */
  startResultIfRequired(node: ItemTreeNode): Observable<string> { // observable of attempt_id
    const attemptId = node.data.attemptId;
    if (attemptId === null) {
      const startingAttemptId = '0';
      return this.resultActionsService
        .start(node.itemPath.concat([ node.data.id ]), startingAttemptId)
        .pipe(
          map(() => startingAttemptId)
        );
    } else {
      return of(attemptId);
    }
  }

}
