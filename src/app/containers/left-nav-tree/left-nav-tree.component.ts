import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TreeNode, SharedModule } from 'primeng/api';
import { ItemTypeCategory } from 'src/app/items/models/item-type';
import { NavTreeData, NavTreeElement } from '../../models/left-nav-loading/nav-tree-data';
import { SkillProgressComponent } from '../../ui-components/skill-progress/skill-progress.component';
import { TooltipModule } from 'primeng/tooltip';
import { ScoreRingComponent } from '../../ui-components/score-ring/score-ring.component';
import { TreeModule } from 'primeng/tree';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LeftMenuBackButtonComponent } from '../../ui-components/left-menu-back-button/left-menu-back-button.component';
import { NgIf, NgClass, I18nPluralPipe, I18nSelectPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';

export interface CustomTreeNode<T> extends TreeNode {
  data: T,
}

@Component({
  selector: 'alg-left-nav-tree',
  templateUrl: './left-nav-tree.component.html',
  styleUrls: [ './left-nav-tree.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    LeftMenuBackButtonComponent,
    RouterLink,
    RouterLinkActive,
    TreeModule,
    SharedModule,
    NgClass,
    ScoreRingComponent,
    TooltipModule,
    SkillProgressComponent,
    I18nPluralPipe,
    I18nSelectPipe,
    ButtonModule,
  ],
})
export class LeftNavTreeComponent implements OnChanges {
  @Input() data?: NavTreeData;
  @Input() elementType: ItemTypeCategory | 'group' = 'activity';

  nodes: CustomTreeNode<NavTreeElement>[] = [];

  ngOnChanges(_changes: SimpleChanges): void {
    this.nodes = this.data ? this.mapItemToNodes(this.data).map(n => ({ ...n, inL1: true })) : [];
  }

  private mapItemToNodes(data: NavTreeData): CustomTreeNode<NavTreeElement>[] {
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

  toggleFolder(node: CustomTreeNode<NavTreeElement>): void {
    // if this is the "selected" node of the menu, expand/collapse it... otherwise just select it
    if (node.data.route.id === this.data?.selectedElementId) {
      this.nodes = this.nodes.map(n => (n == node ? { ...n, expanded: !n.expanded } : n));
    } else this.selectNode(node);
  }

  navigateToParent(): void {
    if (!this.data) throw new Error('Unexpected: missing data for left nav tree (navigateToParent)');
    if (!this.data.parent) throw new Error('Unexpected: missing parent when navigating to parent');
    const parent = this.data.parent;
    parent.navigateTo(true);
  }

  selectNode(node: CustomTreeNode<NavTreeElement>): void {
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
