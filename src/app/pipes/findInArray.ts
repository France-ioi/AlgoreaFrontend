import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'findInArray',
  pure: true,
  standalone: true
})
export class FindInArray implements PipeTransform {

  transform<T>(array: T[], target: T): T | undefined {
    return array.find(o => target === o);
  }
}
