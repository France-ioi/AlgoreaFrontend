import { Component, effect, input, Input, signal } from '@angular/core';
import { ItemTypeCategory } from 'src/app/items/models/item-type';
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
  }, { allowSignalWrites: true });

  private mapItemToNodes(data: NavTreeData): TreeNode<NavTreeElement>[] {
    return data.elements.map(e => {
      const isSelected = !!data.selectedElementId && data.selectedElementId === e.route.id;
      const pathToChildren = data.pathToElements.concat([ e.route.id ]);
      return {
        data: e,
        label: e.title,
        type: this.typeForElement(e),
        leaf: e.hasChildren,
        hasChildren: e.hasChildren,
        expanded: !!e.children,
        children: e.children ?
          this.mapItemToNodes(new NavTreeData(e.children, pathToChildren, undefined, data.selectedElementId)) :
          undefined,
        partialSelected: isSelected,
        inL1: false,
      };
    });
  }

  toggleFolder(node: TreeNode<NavTreeElement>): void {
    // if this is the "selected" node of the menu, expand/collapse it... otherwise just select it
    if (node.data.route.id === this.data().selectedElementId) {
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
