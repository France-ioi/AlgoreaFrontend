import { ContentBreadcrumbs } from 'src/app/models/content/content-breadcrumbs';
import { BreadcrumbItem } from '../data-access/get-breadcrumb.service';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { Item } from 'src/app/data-access/get-item-by-id.service';
import { ItemTypeCategory } from './item-type';
import { resolveLeftNavIcon } from './left-nav-icons';
import { canCurrentUserViewContent, canCurrentUserViewInfo, ItemWithViewPerm } from './item-view-permission';

export interface ItemBreadcrumbIconContext {
  category: ItemTypeCategory,
  item: Item,
}

function isItemLeftNavLocked(item: ItemWithViewPerm & { requiresExplicitEntry: boolean }): boolean {
  return canCurrentUserViewInfo(item) && !canCurrentUserViewContent(item) && !item.requiresExplicitEntry;
}

export function formatBreadcrumbs(
  breadcrumbs: BreadcrumbItem[],
  itemRouter: ItemRouter,
  iconContext?: ItemBreadcrumbIconContext,
): ContentBreadcrumbs {
  const formatted: ContentBreadcrumbs = breadcrumbs.map(el => ({
    title: el.title,
    navigateTo: (): void => itemRouter.navigateTo(el.route, { useCurrentObservation: true }),
  }));

  if (iconContext && formatted.length > 0) {
    const last = formatted[formatted.length - 1]!;
    const { item, category } = iconContext;
    last.icon = resolveLeftNavIcon({
      category,
      itemType: item.type,
      leftNavIcon: item.displaySettings.leftNavIcon,
      locked: isItemLeftNavLocked(item),
    });
  }

  return formatted;
}
