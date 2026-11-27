import { Component, effect, input, signal } from '@angular/core';
import { asapScheduler } from 'rxjs';
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
} from '@angular/cdk/tree';
import { resolveLeftNavIconForType, LeftNavElementType } from 'src/app/items/models/left-nav-icons';
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
  styleUrl: './left-nav-tree.component.scss',
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
  elementType = input<ItemTypeCategory | 'group'>('activity');

  nodes = signal<TreeNode<NavTreeElement>[]>([]);
  childrenAccessor = (node: TreeNode<NavTreeElement>): TreeNode<NavTreeElement>[] => node.children ?? [];
  /**
   * Nodes are rebuilt on every data change and toggle, and the CDK tree never forgets the keys it has seen (expansion model,
   * node registry), so key them by route rather than by object to keep those bounded. Path + id: the same item id may appear
   * at two paths.
   */
  expansionKey = (node: TreeNode<NavTreeElement>): string => [ ...node.data.route.path, node.data.route.id ].join('/');
  /**
   * The CDK defaults `trackBy` to `expansionKey`; keep tracking by object so rebuilt nodes are re-rendered (on a mere identity
   * change the CDK only swaps the template context, leaving the tree node, hence its children, on the previous object).
   */
  trackByNode = (_index: number, node: TreeNode<NavTreeElement>): TreeNode<NavTreeElement> => node;

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

  /**
   * The CDK tree keyboard handling (arrow keys, `*`) expands/collapses nodes in the tree's own expansion model, which drives
   * `aria-expanded`. Expansion is owned by `node.expanded` (only the selected first-level folder may be toggled, by click), so
   * undo any change that disagrees with it: the keyboard keeps having no visible effect and `aria-expanded` stays truthful.
   * The undo is deferred: this event is emitted while the CDK's SelectionModel is still emitting, and changing it synchronously
   * re-emits the pending change, which loops forever.
   */
  onTreeExpandedChange(node: TreeNode<NavTreeElement>, treeNode: CdkNestedTreeNode<TreeNode<NavTreeElement>>, expanded: boolean): void {
    if (expanded === node.expanded) return;
    asapScheduler.schedule(() => {
      if (treeNode.isExpanded === node.expanded) return;
      if (node.expanded) treeNode.expand();
      else treeNode.collapse();
    });
  }

  onChevronClick(event: Event, node: TreeNode<NavTreeElement>): void {
    if (!node.inL1 || !node.isExpandable) return;
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

  private typeForElement(e: NavTreeElement): LeftNavElementType {
    switch (this.elementType()) {
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

  private iconForElementWithType(e: NavTreeElement, type: LeftNavElementType): string {
    return resolveLeftNavIconForType(type, this.isNavLocked(e), e.leftNavIcon);
  }

  private isExpandableType(type: string, hasChildren: boolean): boolean {
    return hasChildren && (type === 'chapter' || type === 'skill-folder' || type === 'group');
  }

}
