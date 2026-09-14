import { Item } from 'src/app/data-access/get-item-by-id.service';
import { Result } from '../models/attempts';

export function patchItemScore(item: Item, newScore: number): Item {
  return { ...item, bestScore: Math.max(item.bestScore, newScore) };
}

export function patchResultScore(results: Result[], attemptId: string, newScore: number): Result[] {
  return results.map(result => {
    if (result.attemptId !== attemptId) return result;
    const score = Math.max(newScore, result.score);
    const validated = newScore >= 100 || result.validated;
    return { ...result, score, validated };
  });
}
