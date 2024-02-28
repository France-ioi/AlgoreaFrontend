import { Pipe, PipeTransform } from '@angular/core';
import { UserBase, formatUser } from '../groups/models/user';

@Pipe({
  name: 'userCaption', pure: true,
  standalone: true
})
export class UserCaptionPipe implements PipeTransform {
  transform(user: UserBase): string {
    return formatUser(user);
  }
}
