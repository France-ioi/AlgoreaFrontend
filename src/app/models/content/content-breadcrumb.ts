import { UrlTree } from '@angular/router';

export type ContentBreadcrumb = {
  title: string,
  navigateTo?: UrlTree|(() => UrlTree),
}[];
