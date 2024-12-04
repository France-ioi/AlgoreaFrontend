import { UrlTree } from '@angular/router';

export interface ContentBreadcrumb {
  path: {
    title: string,
    navigateTo?: UrlTree|(() => UrlTree),
  }[],
  currentPageIdx: number, // index of the current page in the path array, -1 to select the category
}

