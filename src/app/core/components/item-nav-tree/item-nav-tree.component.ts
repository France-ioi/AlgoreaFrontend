import { Component, Input, OnChanges, SimpleChanges, EventEmitter, Output } from '@angular/core';
import { TreeNode } from 'primeng/api';
import * as _ from 'lodash-es';
import { Item, ItemNavigationService, MenuItems } from '../../http-services/item-navigation.service';
import { ResultActionsService } from 'src/app/shared/http-services/result-actions.service';
import { of, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

// ItemTreeNode is PrimeNG tree node with data forced to be an item
interface ItemTreeNode extends TreeNode {
  data: Item
  target: string
  status: 'ready'|'loading'|'error'
}

function itemsToTreeNodes(items: Item[]): ItemTreeNode[] {
  return _.map(items, (i) => {
    return {
      label: i.title,
      data: i,
      type:  i.hasChildren ? 'folder' : 'leaf',
      leaf: i.hasChildren,
      target: `/items/details/${i.id}`, /* FIXME to be removed with the attribute? */
      status: 'ready',
    };
  });
}

export interface Target {
  item: Item,
  attemptId?: string
}

@Component({
  selector: 'alg-item-nav-tree',
  templateUrl: './item-nav-tree.component.html',
  styleUrls: ['./item-nav-tree.component.scss']
})
export class ItemNavTreeComponent implements OnChanges {
  @Input() items: Item[] = [];
  @Output() navigateToItem = new EventEmitter<Target>();

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
  selectedNode: TreeNode|null;

  constructor(
    private resultActionsService: ResultActionsService,
    private itemNavService: ItemNavigationService,
  ) {}

  ngOnChanges(_changes: SimpleChanges) {
    this.nodes = itemsToTreeNodes(this.items);
  }

  selectNode(node: ItemTreeNode) {
    this.selectedNode = node;
    // this.navigateToItem.emit(node.data);


    /* Update the menu */
    // if (node.status === 'loading' || !node.data.hasChildren /*|| already loaded*/) return;


    if (node.status === 'loading') return;

    if (this.isFirstLevelNode(node)) {
      // if it is a first level node, do not change the root of the menu.
      // just create an attempt if needed, navigate to it, and load children if needed

      if (!node.data.hasChildren) { // leaf
        this.navigateToItem.emit({item: node.data});
      } else {
        // item having children: start a result (if not done yet), navigate and load children
        node.status = 'loading';
        this.startResultIfRequired(node).pipe(
          switchMap( (attemptId) => {
            if (this.selectedNode === node) {
              this.navigateToItem.emit({item: node.data, attemptId: attemptId});
              return this.loadChildren(node, attemptId);
            }
            else return of<void>(null); // if the node is not selected anymore, do not navigate and do not load children
          })
        ).subscribe({
          error: (_error) => {
            node.status = 'error';
            /* should handle error somehow */
          },
          complete: () => {
            node.status = 'ready';
          }
        });
      }

    } else {
      // if it is a children of an item, we need to set the item as the root of the tree
      // CALL ITEM NAV TO SHIFT TRE AND SELECT THE NODE IN TREE
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

  /**
   * Start a new result only if the node does not have a result started yet
   */
  startResultIfRequired(node: ItemTreeNode): Observable<string|null> { // observable of attempt_id
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

  loadChildren(node: ItemTreeNode, attemptId: string): Observable<void> {
    return this.itemNavService
      .getNavData(node.data.id, attemptId)
      .pipe(
        map((data: MenuItems) => {
          // TODO: update parent
          if (this.selectedNode === node) {
            node.children = itemsToTreeNodes(data.children);
            node.expanded = true; // only expend if it is still the selected item in the menu
          }
          // return nothing, so map to void
        })
      );
  }

}
