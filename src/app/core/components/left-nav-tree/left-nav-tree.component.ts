import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { defaultAttemptId } from 'src/app/shared/helpers/attempts';
import { ItemTypeCategory } from 'src/app/shared/helpers/item-type';
import { GroupRouter } from 'src/app/shared/routing/group-router';
import { ItemRouter } from 'src/app/shared/routing/item-router';
import { isANavMenuItem } from '../../services/left-nav-loading/item-nav-tree-types';
import { NavTreeData, NavTreeElement } from '../../services/left-nav-loading/nav-tree-data';

type LeftNavTreeNode = TreeNode<{
  element: NavTreeElement,
  path: string[],
  status: 'ready'|'loading'|'error',
  current: boolean,
}>

@Component({
  selector: 'alg-left-nav-tree',
  templateUrl: './left-nav-tree.component.html',
  styleUrls: [ './left-nav-tree.component.scss' ]
})
export class LeftNavTreeComponent implements OnChanges {
  @Input() data?: NavTreeData<NavTreeElement>;
  @Input() elementType: ItemTypeCategory | 'group' = 'activity';

  nodes: LeftNavTreeNode[] = [];

  constructor(
    private itemRouter: ItemRouter,
    private groupRouter: GroupRouter,
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {
    this.nodes = this.data ? this.mapItemToNodes(this.data) : [];
  }

  private mapItemToNodes(data: NavTreeData<NavTreeElement>): LeftNavTreeNode[] {
    return data.elements.map(e => {
      const isSelected = !!data.selectedElementId && data.selectedElementId === e.id;
      const shouldShowChildren = e.hasChildren && isSelected;
      const pathToChildren = data.pathToElements.concat([ e.id ]);
      return {
        data: {
          element: e,
          path: data.pathToElements,
          status: shouldShowChildren && !e.children ? 'loading' : 'ready',
          current: isSelected,
        },
        label: e.title,
        type: this.typeForElement(e),
        leaf: e.hasChildren,
        expanded: !!(shouldShowChildren && e.children),
        children: shouldShowChildren && e.children ? this.mapItemToNodes(new NavTreeData(e.children, pathToChildren)) : undefined,
        checked: isSelected
      };
    });
  }

  navigateToParent(): void {
    if (!this.data) throw new Error('Unexpected: missing data for left nav tree (navigateToParent)');
    if (!this.data.parent) throw new Error('Unexpected: missing parent when navigating to parent');
    const parent = this.data.parent;
    const pathToParent = this.data.pathToElements.slice(0, -1);

    switch (this.elementType) {
      case 'group':
        this.groupRouter.navigateTo({ contentType: 'group', id: parent.id, path: pathToParent });
        break;
      case 'activity':
      case 'skill': {
        if (!isANavMenuItem(parent)) throw new Error('Unexpected: Element which is not an item as an item root!');
        const typeCat : ItemTypeCategory = this.elementType === 'activity' ? 'activity' : 'skill';
        if (!parent.attemptId) throw new Error('Unexpected: missing attempt id for parent node in tree (2)');
        this.itemRouter.navigateTo({ contentType: typeCat, id: parent.id, path: pathToParent, attemptId: parent.attemptId });
      }
    }
  }

  selectNode(node: LeftNavTreeNode): void {
    // set the node to "loading" so that the user knows the children should appear shortly
    if (node.data?.element.hasChildren && !node.data.element.children) node.data.status = 'loading';

    this.navigateToNode(node);
  }

  private navigateToNode(node: LeftNavTreeNode): void {
    if (!node.data) throw new Error('Unexpected: missing node data');
    const routeBase = { id: node.data.element.id, path: node.data.path };
    switch (this.elementType) {
      case 'group':
        this.groupRouter.navigateTo({ ...routeBase, contentType: 'group' });
        break;
      case 'activity':
      case 'skill': {
        if (!isANavMenuItem(node.data.element)) throw new Error('Unexpected: Element which is not an item in an item tree!');
        const typeCat : ItemTypeCategory = this.elementType === 'activity' ? 'activity' : 'skill';
        if (node.data.element.attemptId) {
          this.itemRouter.navigateTo({ ...routeBase, contentType: typeCat, attemptId: node.data.element.attemptId });
        } else {
          this.itemRouter.navigateTo({ ...routeBase, contentType: typeCat, parentAttemptId: this.parentAttemptForNode(node) });
        }
      }
    }
  }

  /**
   * Return the parent attempt id of this node.
   * If the node is a one of the elements (niv1), use the parent
   * Otherwise use the parent node.
   */
  private parentAttemptForNode(node: LeftNavTreeNode): string {
    if (node.parent) {
      if (!node.parent.data) throw new Error('Unexpected: missing data in node\'s parent');
      if (!isANavMenuItem(node.parent.data.element)) throw new Error('Unexpected: Item node parent is not an item node!');
      if (node.parent.data.element.attemptId === null) throw new Error('Unexpected: parent of an item node has no attempt');
      return node.parent.data.element.attemptId;
    } else if (this.data?.parent) {
      if (!isANavMenuItem(this.data.parent)) throw new Error('Unexpected: Tree parent is not an item node while searching for attempts!');
      if (this.data.parent.attemptId === null) throw new Error('Unexpected: item tree parent has no attempt');
      return this.data.parent.attemptId;
    }
    return defaultAttemptId; // if the node has no parent, i.e. is a root, use default attempt
  }

  private typeForElement(e: NavTreeElement): string {
    switch (this.elementType) {
      case 'activity':
        return e.hasChildren ? 'chapter' : 'task-course';
      case 'skill':
        return e.hasChildren ? 'skill-folder' : 'skill-leaf';
      case 'group':
        return 'group';
    }
  }

  onPaginateButtonClick() {
  }

  trackByFn = (index: number): number => {
    return index;
  }

}
