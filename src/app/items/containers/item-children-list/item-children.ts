import { ItemChildCategory } from 'src/app/items/models/item-properties';
import { ItemType } from 'src/app/items/models/item-type';

export interface ItemChildWithAdditions {
  id: string,
  string: {
    title: string | null,
    subtitle?: string | null,
    imageUrl: string | null,
  },
  category: ItemChildCategory,
  type: ItemType,
  watchedGroup?: {
    allValidated?: boolean,
    avgScore?: number,
  },
  bestScore: number,
  isLocked: boolean,
  result?: {
    attemptId: string,
    validated: boolean,
    score: number,
  },
  noScore?: boolean,
}
