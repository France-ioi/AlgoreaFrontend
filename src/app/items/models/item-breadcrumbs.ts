import { ContentBreadcrumb } from 'src/app/models/content/content-breadcrumb';
import { BreadcrumbItem } from '../data-access/get-breadcrumb.service';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { UrlTree } from '@angular/router';

const itemBreadcrumbCat = $localize`Items`;

export function formatBreadcrumbs(breadcrumbs: BreadcrumbItem[] | undefined, itemRouter: ItemRouter): ContentBreadcrumb {
  if (!breadcrumbs) return { category: itemBreadcrumbCat, path: [], currentPageIdx: -1 };
  return {
    category: itemBreadcrumbCat,
    path: breadcrumbs.map(el => ({
      title: el.title,
      hintNumber: el.attemptCnt,
      navigateTo: ():UrlTree => itemRouter.url(el.route),
    })),
    currentPageIdx: breadcrumbs.length - 1,
  };
}
