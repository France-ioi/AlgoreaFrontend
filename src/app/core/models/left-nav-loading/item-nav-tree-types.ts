import { NavMenuItem } from '../../common/nav-menu-item';
import { NavTreeElement } from './nav-tree-data';

export function isANavMenuItem(e: NavTreeElement): e is NavMenuItem {
  return 'attemptId' in e;
}
