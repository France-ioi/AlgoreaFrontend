import { Pipe, PipeTransform } from '@angular/core';

interface UserInfos {
  login: string,
  firstName: string|null,
  lastName: string|null,
}

@Pipe({ name: 'user' })
export class UserPipe implements PipeTransform {
  transform<T extends UserInfos>(userInfos: T) : string {
    if (userInfos.firstName !== null && userInfos.firstName !== '' && userInfos.lastName !== null && userInfos.lastName !== '') {
      return `${userInfos.firstName} ${userInfos.lastName} (${userInfos.login})`;
    } else if (userInfos.firstName !== null && userInfos.firstName !== '') {
      return `${userInfos.firstName} (${userInfos.login})`;
    } else if (userInfos.lastName !== null && userInfos.lastName !== '') {
      return `${userInfos.lastName} (${userInfos.login})`;
    } else {
      return userInfos.login;
    }
  }
}
