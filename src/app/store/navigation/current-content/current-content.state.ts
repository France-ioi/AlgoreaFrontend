import { ContentBreadcrumbs } from 'src/app/models/content/content-breadcrumbs';
import { ContentRoute } from 'src/app/models/routing/content-route';
import { appDefaultActivityRoute } from 'src/app/models/routing/item-route';

export interface State {
  route: ContentRoute|string, // FIXME: the string is current for pages (not by id) which does not match a content route
  title: string|undefined,
  breadcrumbs: ContentBreadcrumbs|undefined,
}

export const initialState: State = {
  route: appDefaultActivityRoute,
  title: undefined,
  breadcrumbs: undefined,
};
