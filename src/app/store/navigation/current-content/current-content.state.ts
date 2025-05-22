import { ContentBreadcrumbs } from 'src/app/models/content/content-breadcrumbs';
import { ContentRoute } from 'src/app/models/routing/content-route';

export interface State {
  route: ContentRoute|string /* currently for pages (not by id) which does not match a content route */|null /* only initially */,
  title: string|undefined,
  breadcrumbs: ContentBreadcrumbs|undefined,
}

export const initialState: State = {
  route: null, // initially, will be set by the first visited content
  title: undefined,
  breadcrumbs: undefined,
};
