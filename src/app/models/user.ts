export interface FormattableUser {
  login: string,
  firstName?: string|null,
  lastName?: string|null,
}

export function formatUser<T extends FormattableUser>(user: T) : string {
  if (user.firstName || user.lastName) {
    let fullName = '';

    if (user.firstName) {
      fullName += user.firstName;
    }

    if (user.lastName) {
      fullName += user.firstName ? ` ${ user.lastName }` : user.lastName;
    }

    return `${ fullName } (${ user.login })`;
  }

  return user.login;
}
