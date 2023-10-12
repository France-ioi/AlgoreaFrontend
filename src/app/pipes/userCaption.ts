import { Pipe, PipeTransform } from '@angular/core';
import { FormattableUser, formatUser } from '../models/user';

@Pipe({
  name: 'userCaption', pure: true,
  standalone: true
})
export class UserCaptionPipe implements PipeTransform {
  transform(user: FormattableUser): string {
    return formatUser(user);
  }
}
