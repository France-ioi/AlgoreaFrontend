import { BaseItemChildCategory, ItemChildType } from '../../http-services/get-item-children.service';

export interface ItemChildWithAdditions {
  id: string,
  string: {
    title: string | null,
    subtitle?: string | null,
    imageUrl: string | null,
  },
  category: BaseItemChildCategory,
  type: ItemChildType,
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
