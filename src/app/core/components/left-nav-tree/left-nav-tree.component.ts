import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { ItemTypeCategory } from 'src/app/shared/helpers/item-type';
import { NavTreeData, NavTreeElement } from '../../models/left-nav-loading/nav-tree-data';

@Component({
  selector: 'alg-left-nav-tree',
  templateUrl: './left-nav-tree.component.html',
  styleUrls: [ './left-nav-tree.component.scss' ]
})
export class LeftNavTreeComponent implements OnChanges {
  @Input() data?: NavTreeData;
  @Input() elementType: ItemTypeCategory | 'group' = 'activity';

  nodes: TreeNode<NavTreeElement>[] = [];

  ngOnChanges(_changes: SimpleChanges): void {
    this.nodes = this.data ? this.mapItemToNodes(this.data) : [];
  }

  private mapItemToNodes(data: NavTreeData): TreeNode<NavTreeElement>[] {
    return data.elements.map(e => {
      const isSelected = !!data.selectedElementId && data.selectedElementId === e.route.id;
      const pathToChildren = data.pathToElements.concat([ e.route.id ]);
      return {
        data: e,
        label: e.title,
        type: this.typeForElement(e),
        leaf: e.hasChildren,
        expanded: !!(isSelected && e.children),
        children: isSelected && e.children ? this.mapItemToNodes(new NavTreeData(e.children, pathToChildren)) : undefined,
        partialSelected: isSelected
      };
    });
  }

  navigateToParent(): void {
    if (!this.data) throw new Error('Unexpected: missing data for left nav tree (navigateToParent)');
    if (!this.data.parent) throw new Error('Unexpected: missing parent when navigating to parent');
    const parent = this.data.parent;
    parent.navigateTo(true);
  }

  selectNode(node: TreeNode<NavTreeElement>): void {
    if (!this.data) throw new Error('Unexpected: missing data for left nav tree (selectNode)');
    node.data?.navigateTo(true);
  }

  private typeForElement(e: NavTreeElement): string {
    switch (this.elementType) {
      case 'activity':
        return e.hasChildren ? 'chapter' : 'task';
      case 'skill':
        return e.hasChildren ? 'skill-folder' : 'skill-leaf';
      case 'group':
        return 'group';
    }
  }

}
