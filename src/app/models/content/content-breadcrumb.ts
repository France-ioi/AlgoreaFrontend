import { UrlTree } from '@angular/router';

export interface ContentBreadcrumb {
  path: {
    title: string,
    navigateTo?: UrlTree|(() => UrlTree),
  }[],
}

