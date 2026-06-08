import { Component, effect, input, Input, signal, ChangeDetectionStrategy } from '@angular/core';
import { isAChapter, isASkill, ItemTypeCategory } from 'src/app/items/models/item-type';
import { areSameElements } from '../../models/routing/entity-route';
import { NavTreeData, NavTreeElement } from '../../models/left-nav-loading/nav-tree-data';
import { SkillProgressComponent } from '../../ui-components/skill-progress/skill-progress.component';
import { ScoreRingComponent } from '../../ui-components/score-ring/score-ring.component';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LeftMenuBackButtonComponent } from '../../ui-components/left-menu-back-button/left-menu-back-button.component';
import { NgTemplateOutlet, I18nSelectPipe } from '@angular/common';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import {
  CdkNestedTreeNode,
  CdkTree,
  CdkTreeModule,
  CdkTreeNodeDef,
  CdkTreeNodeOutlet,
  NestedTreeControl
} from '@angular/cdk/tree';
import { isLeftNavIconOption } from 'src/app/items/models/left-nav-icons';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';

interface TreeNode<T> {
  data: T,
  children?: TreeNode<T>[],
  expanded: boolean,
  label: string,
  type: string,
  icon: string,
  isExpandable: boolean,
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
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    LeftMenuBackButtonComponent,
    RouterLink,
    RouterLinkActive,
    NgTemplateOutlet,
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

  iconForElement(e: NavTreeElement): string {
    const type = this.typeForElement(e);
    return this.iconForElementWithType(e, type);
  }

  lockedAccessTooltip(node: TreeNode<NavTreeElement>): string | null {
    if (!this.isNavLocked(node.data)) {
      return null;
    }
    switch (node.type) {
      case 'chapter':
        return $localize`Your current access rights do not allow you to list the content of this chapter.`;
      case 'task':
        return $localize`Your current access rights do not allow you to start the activity.`;
      default:
        return null;
    }
  }

  private mapItemToNodes(data: NavTreeData): TreeNode<NavTreeElement>[] {
    return data.elements.map(e => {
      const isSelected = !!data.selectedElementRoute && areSameElements(e.route, data.selectedElementRoute);
      const pathToChildren = data.pathToElements.concat([ e.route.id ]);
      const type = this.typeForElement(e);
      return {
        data: e,
        label: e.title,
        type,
        icon: this.iconForElementWithType(e, type),
        isExpandable: this.isExpandableType(type, e.hasChildren),
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

  onChevronClick(event: Event, node: TreeNode<NavTreeElement>): void {
    event.stopPropagation();
    this.toggleFolder(node);
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
        if (e.itemType) {
          return isAChapter({ type: e.itemType }) ? 'chapter' : 'task';
        }
        return e.hasChildren ? 'chapter' : 'task';
      case 'skill':
        if (e.itemType) {
          return isASkill({ type: e.itemType }) ? 'skill-folder' : 'skill-leaf';
        }
        return e.hasChildren ? 'skill-folder' : 'skill-leaf';
      case 'group':
        return 'group';
    }
  }

  private isNavLocked(e: NavTreeElement): boolean {
    return !!e.infoOnly && !e.requiresExplicitEntry;
  }

  private iconForElementWithType(e: NavTreeElement, type: string): string {
    return this.iconForType(type, this.isNavLocked(e), e.leftNavIcon);
  }

  private iconForType(type: string, locked = false, leftNavIcon?: string): string {
    if (locked) {
      switch (type) {
        case 'chapter':
          return 'ph-folder-simple-lock';
        case 'task':
          return 'ph-file-lock';
      }
    }
    if (leftNavIcon && isLeftNavIconOption(leftNavIcon)) {
      return `ph-${leftNavIcon}`;
    }
    switch (type) {
      case 'chapter':
      case 'skill-folder':
        return 'ph-folder-simple';
      case 'task':
        return 'ph-file-text';
      case 'skill-leaf':
        return 'ph-graduation-cap';
      case 'group':
        return 'ph-users-three';
      default:
        return 'ph-files';
    }
  }

  private isExpandableType(type: string, hasChildren: boolean): boolean {
    return hasChildren && (type === 'chapter' || type === 'skill-folder' || type === 'group');
  }

}
