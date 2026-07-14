import { isAChapter, isASkill, ItemType, ItemTypeCategory } from './item-type';
import { isLeftNavIconOption } from './left-nav-icon-options';

export { LEFT_NAV_ICON_OPTIONS, type LeftNavIconOption, isLeftNavIconOption } from './left-nav-icon-options';

export type LeftNavCategory = ItemTypeCategory | 'group';

export type LeftNavElementType = 'chapter' | 'task' | 'skill-folder' | 'skill-leaf' | 'group';

export interface ResolveLeftNavIconParams {
  category: LeftNavCategory,
  itemType?: ItemType,
  hasChildren?: boolean,
  leftNavIcon?: string | null,
  locked?: boolean,
}

export function defaultLeftNavIcon(type: ItemType): string {
  return isAChapter({ type }) ? 'folder-simple' : 'file-text';
}

export function resolveLeftNavElementType(params: ResolveLeftNavIconParams): LeftNavElementType {
  switch (params.category) {
    case 'activity':
      if (params.itemType) {
        return isAChapter({ type: params.itemType }) ? 'chapter' : 'task';
      }
      return params.hasChildren ? 'chapter' : 'task';
    case 'skill':
      if (params.itemType) {
        return isASkill({ type: params.itemType }) ? 'skill-folder' : 'skill-leaf';
      }
      return params.hasChildren ? 'skill-folder' : 'skill-leaf';
    case 'group':
      return 'group';
  }
}

export function resolveLeftNavIcon(params: ResolveLeftNavIconParams): string {
  return resolveLeftNavIconForType(resolveLeftNavElementType(params), params.locked ?? false, params.leftNavIcon);
}

export function resolveLeftNavIconForType(type: LeftNavElementType, locked = false, leftNavIcon?: string | null): string {
  if (locked) {
    switch (type) {
      case 'chapter':
        return 'ph-folder-simple-lock';
      case 'task':
        return 'ph-file-lock';
      case 'skill-folder':
      case 'skill-leaf':
      case 'group':
        break;
    }
  }
  if (leftNavIcon && isLeftNavIconOption(leftNavIcon)) {
    return `ph-${leftNavIcon}`;
  }
  switch (type) {
    case 'chapter':
    case 'skill-folder':
      return 'ph-folder-simple';
    case 'task':
      return 'ph-file-text';
    case 'skill-leaf':
      return 'ph-graduation-cap';
    case 'group':
      return 'ph-users-three';
  }
}
