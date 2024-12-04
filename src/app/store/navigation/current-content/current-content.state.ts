import { ContentBreadcrumb } from 'src/app/models/content/content-breadcrumb';
import { ContentRoute } from 'src/app/models/routing/content-route';
import { appDefaultActivityRoute } from 'src/app/models/routing/item-route';

export interface State {
  route: ContentRoute|string, // FIXME: the string is current for pages (not by id) which does not match a content route
  title: string|undefined,
  breadcrumbs: ContentBreadcrumb|undefined,
}

export const initialState: State = {
  route: appDefaultActivityRoute,
  title: undefined,
  breadcrumbs: undefined,
};
