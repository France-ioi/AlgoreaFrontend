import { Pipe, PipeTransform } from '@angular/core';
import { GroupLike, isUser } from '../models/routing/group-route';

@Pipe({
  name: 'isUser', pure: true,
  standalone: true
})
export class GroupIsUserPipe implements PipeTransform {

  transform(groupOrRoute: GroupLike): boolean {
    return isUser(groupOrRoute);
  }
}
