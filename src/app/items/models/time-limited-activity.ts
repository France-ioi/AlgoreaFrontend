import { Item } from 'src/app/data-access/get-item-by-id.service';
import { isAChapter, isATask } from './item-type';
import { canCurrentUserViewContent } from './item-view-permission';
import { canCurrentUserGrantView } from './item-grant-view-permission';
import { canCurrentUserWatchResult } from './item-watch-permission';
import { Pipe, PipeTransform } from '@angular/core';

type ItemWithTimeLimitedActivityInfo = Pick<Item, 'type'|'requiresExplicitEntry'|'duration'>;
interface TimeLimitedActivityAssertion {
  duration: NonNullable<Item['duration']>,
  requiresExplicitEntry: true,
}
export function isTimeLimitedActivity<T extends ItemWithTimeLimitedActivityInfo>(item: T): item is T & TimeLimitedActivityAssertion {
  if (!isATask(item) && !isAChapter(item)) return false;
  if (!item.requiresExplicitEntry) return false;
  if (!item.duration) return false;
  return item.duration.ms > 0;
}

export function canCurrentUserSetExtraTime(item: Pick<Item, 'permissions'>): boolean {
  if (item.permissions.isOwner) return true;
  return canCurrentUserViewContent(item) && canCurrentUserGrantView(item) && canCurrentUserWatchResult(item);
}


// ********************************************
// Pipes for templates
// ********************************************

@Pipe({
  name: 'isTimeLimitedActivity',
  pure: true,
  standalone: true
})
export class IsTimeLimitedActivityPipe implements PipeTransform {
  transform = isTimeLimitedActivity;
}

@Pipe({
  name: 'canCurrentUserSetExtraTime',
  pure: true,
  standalone: true
})
export class CanCurrentUserSetExtraTimePipe implements PipeTransform {
  transform = canCurrentUserSetExtraTime;
}
