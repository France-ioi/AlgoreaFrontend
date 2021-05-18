import { Pipe, PipeTransform } from '@angular/core';
import { User } from '../../modules/group/http-services/get-user.service';

@Pipe({ name: 'userCaption', pure: true })
export class UserCaptionPipe implements PipeTransform {
  transform(user: User): any {
    return user.firstName && user.lastName ? `${ user.firstName } ${ user.lastName } (${ user.login })` : user.login;
  }
}
