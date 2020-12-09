import { Pipe, PipeTransform } from '@angular/core';
import { formatUser } from '../helpers/user';

@Pipe({ name: 'user' })
export class UserPipe implements PipeTransform {
  transform = formatUser;
}
