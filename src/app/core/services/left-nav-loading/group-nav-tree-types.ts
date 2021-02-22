import { NavMenuGroup } from '../../http-services/group-navigation.service';
import { NavTreeElement } from '../../services/left-nav-loading/nav-tree-data';

export function isANavMenuGroup(e: NavTreeElement): e is NavMenuGroup {
  return '...' in e;
}
