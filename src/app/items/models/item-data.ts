import { FullItemRoute } from 'src/app/models/routing/item-route';
import { BreadcrumbItem } from '../data-access/get-breadcrumb.service';
import { Item } from '../../data-access/get-item-by-id.service';
import { Result } from '../data-access/get-results.service';

/**
 * All fetched data related to one item
 * (for backward (pre-store) compatibily)
 */
export interface ItemData {
  route: FullItemRoute,
  item: Item,
  breadcrumbs: BreadcrumbItem[],
  results?: Result[],
  currentResult?: Result,
}
