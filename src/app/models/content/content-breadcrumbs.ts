import { UrlTree } from '@angular/router';

export type ContentBreadcrumbs = {
  title: string,
  navigateTo?: UrlTree|(() => UrlTree),
}[];
