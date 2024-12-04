import { ContentBreadcrumb } from 'src/app/models/content/content-breadcrumb';
import { BreadcrumbItem } from '../data-access/get-breadcrumb.service';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { UrlTree } from '@angular/router';

export function formatBreadcrumbs(breadcrumbs: BreadcrumbItem[] | undefined, itemRouter: ItemRouter): ContentBreadcrumb {
  if (!breadcrumbs) return { path: [] };
  return {
    path: breadcrumbs.map(el => ({
      title: el.title,
      navigateTo: ():UrlTree => itemRouter.url(el.route),
    })),
  };
}
