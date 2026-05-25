import { Component, effect, input, Input, signal } from '@angular/core';
import { ItemTypeCategory } from 'src/app/items/models/item-type';
import { areSameElements } from '../../models/routing/entity-route';
import { NavTreeData, NavTreeElement } from '../../models/left-nav-loading/nav-tree-data';
import { SkillProgressComponent } from '../../ui-components/skill-progress/skill-progress.component';
import { ScoreRingComponent } from '../../ui-components/score-ring/score-ring.component';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LeftMenuBackButtonComponent } from '../../ui-components/left-menu-back-button/left-menu-back-button.component';
import { NgClass, I18nSelectPipe } from '@angular/common';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import {
  CdkNestedTreeNode,
  CdkTree,
  CdkTreeModule,
  CdkTreeNodeDef,
  CdkTreeNodeOutlet,
  NestedTreeControl
} from '@angular/cdk/tree';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';

interface TreeNode<T> {
  data: T,
  children?: TreeNode<T>[],
  expanded: boolean,
  label: string,
  type: string,
  hasChildren: boolean,
  partialSelected: boolean,
  inL1: boolean,
}

/**
 * Stable CSS selector for the currently-selected node in the tree rendered by `LeftNavTreeComponent`.
 *
 * Exposed as a constant (rather than a hard-coded magic string in consumers like `left-tabbed-content`) so that
 * the source of truth lives next to the template that owns the attribute. The duplicate-id case (same item id at
 * two paths) makes querying by `#nav-{id}` unsafe, so consumers rely on this attribute to find the unique
 * `.selected` node and scroll it into view.
 */
export const SELECTED_NAV_NODE_SELECTOR = '.tree-nav-wrapper[data-selected="true"]';

@Component({
  selector: 'alg-left-nav-tree',
  templateUrl: './left-nav-tree.component.html',
  styleUrls: [ './left-nav-tree.component.scss' ],
  imports: [
    LeftMenuBackButtonComponent,
    RouterLink,
    RouterLinkActive,
    NgClass,
    ScoreRingComponent,
    SkillProgressComponent,
    I18nSelectPipe,
    ButtonComponent,
    CdkNestedTreeNode,
    CdkTreeModule,
    CdkTreeNodeDef,
    CdkTreeNodeOutlet,
    CdkTree,
    TooltipDirective,
  ]
})
export class LeftNavTreeComponent {
  data = input.required<NavTreeData>();
  @Input() elementType: ItemTypeCategory | 'group' = 'activity';

  nodes = signal<TreeNode<NavTreeElement>[]>([]);
  treeControl = new NestedTreeControl<TreeNode<NavTreeElement>>(node => node.children);

  managershipTooltipCaptions = {
    descendant: $localize`You are a manager of one of the descendant of the group`,
    other: $localize`You are a manager of the group`,
  };

  updateNodesEffect = effect(() => {
    this.nodes.set(this.mapItemToNodes(this.data()).map(n => ({ ...n, inL1: true })));
  });

  private mapItemToNodes(data: NavTreeData): TreeNode<NavTreeElement>[] {
    return data.elements.map(e => {
      const isSelected = !!data.selectedElementRoute && areSameElements(e.route, data.selectedElementRoute);
      const pathToChildren = data.pathToElements.concat([ e.route.id ]);
      return {
        data: e,
        label: e.title,
        type: this.typeForElement(e),
        leaf: e.hasChildren,
        hasChildren: e.hasChildren,
        expanded: !!e.children,
        children: e.children ?
          this.mapItemToNodes(new NavTreeData(e.children, pathToChildren, undefined, data.selectedElementRoute)) :
          undefined,
        partialSelected: isSelected,
        inL1: false,
      };
    });
  }

  toggleFolder(node: TreeNode<NavTreeElement>): void {
    // if this is the "selected" node of the menu, expand/collapse it... otherwise just select it
    const selectedRoute = this.data().selectedElementRoute;
    if (selectedRoute && areSameElements(node.data.route, selectedRoute)) {
      this.nodes.update(nodes =>
        nodes.map(n => (n == node ? { ...n, expanded: !n.expanded } : n))
      );
    } else this.selectNode(node);
  }

  navigateToParent(): void {
    const parent = this.data().parent;
    if (!parent) throw new Error('Unexpected: missing parent when navigating to parent');
    parent.navigateTo(true);
  }

  selectNode(node: TreeNode<NavTreeElement>): void {
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
