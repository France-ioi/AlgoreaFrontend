import { Item } from 'src/app/data-access/get-item-by-id.service';
import { Result } from '../data-access/get-results.service';

export function patchItemScore(item: Item, newScore: number): Item {
  return { ...item, bestScore: Math.max(item.bestScore, newScore) };
}

interface Results { results: Result[], currentResult?: Result }
export function patchResultScore(results: Results, newScore: number): Results {
  const score = Math.max(newScore, results.currentResult?.score ?? 0);
  const validated = newScore >= 100 || !!results.currentResult?.validated;
  return { ...results, currentResult: results.currentResult ? { ...results.currentResult, score, validated } : undefined };
}
