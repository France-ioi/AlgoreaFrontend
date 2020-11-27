import { ItemType } from '../../../../shared/helpers/item-type';

export interface ItemChild {
  id?: string,
  title: string | null,
  order: number,
  type?: ItemType,
}
