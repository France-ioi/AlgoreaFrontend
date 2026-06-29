import { Pipe, PipeTransform } from '@angular/core';
import { errorIsHTTPForbidden, errorIsHTTPNotFound } from '../errors';

@Pipe({ name: 'isHttpForbidden' })
export class IsHttpForbiddenPipe implements PipeTransform {
  transform(error: unknown): boolean {
    return errorIsHTTPForbidden(error);
  }
}

@Pipe({ name: 'isHttpNotFound' })
export class IsHttpNotFoundPipe implements PipeTransform {
  transform(error: unknown): boolean {
    return errorIsHTTPNotFound(error);
  }
}
