import { UrlTree } from '@angular/router';

export interface ContentBreadcrumb {
  category: string,
  path: {
    title: string,
    hintNumber?: number,
    navigateTo?: UrlTree|(() => UrlTree),
  }[],
  currentPageIdx: number, // index of the current page in the path array, -1 to select the category
}

