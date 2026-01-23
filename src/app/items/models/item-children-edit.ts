import { ItemPermPropagations } from 'src/app/items/models/item-perm-propagation';
import { ItemCorePerm } from 'src/app/items/models/item-permissions';
import { ItemType } from 'src/app/items/models/item-type';

export type BaseChildData = Partial<ItemPermPropagations> & {
  scoreWeight: number,
  permissions?: ItemCorePerm,
  type: ItemType,
};

interface InvisibleChildData extends BaseChildData {
  id: string,
  isVisible: false,
}

interface ChildData extends BaseChildData {
  id?: string,
  isVisible: true,
  title: string | null,
  url?: string,
  result?: {
    attemptId: string,
    validated: boolean,
    score: number,
  },
}

export type PossiblyInvisibleChildData = ChildData | InvisibleChildData;
export type ChildDataWithId = InvisibleChildData | (ChildData & { id: string });

export function hasId(child: PossiblyInvisibleChildData): child is ChildDataWithId {
  return !!child.id;
}

export const DEFAULT_SCORE_WEIGHT = 1;
