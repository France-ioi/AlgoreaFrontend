import { NavMenuItem } from '../../http-services/item-navigation.service';
import { NavTreeElement } from '../../services/left-nav-loading/nav-tree-data';

export function isANavMenuItem(e: NavTreeElement): e is NavMenuItem {
  return 'attemptId' in e;
}
