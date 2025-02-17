import { ContentBreadcrumbs } from 'src/app/models/content/content-breadcrumbs';
import { BreadcrumbItem } from '../data-access/get-breadcrumb.service';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { UrlTree } from '@angular/router';

export function formatBreadcrumbs(breadcrumbs: BreadcrumbItem[], itemRouter: ItemRouter): ContentBreadcrumbs {
  return breadcrumbs.map(el => ({
    title: el.title,
    navigateTo: ():UrlTree => itemRouter.url(el.route),
  }));
}
