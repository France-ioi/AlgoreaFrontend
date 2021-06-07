import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'userCaption', pure: true })
export class UserCaptionPipe implements PipeTransform {
  transform(user: { firstName?: string | null, lastName?: string | null, login: string }): string {
    if (user.firstName || user.lastName) {
      let fullName = '';

      if (user.firstName) {
        fullName += user.firstName;
      }

      if (user.lastName) {
        fullName += user.firstName ? ` ${user.lastName}` : user.lastName;
      }

      return `${fullName} (${ user.login })`;
    }

    return user.login;
  }
}
