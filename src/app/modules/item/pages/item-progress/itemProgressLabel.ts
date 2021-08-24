import { Pipe, PipeTransform } from '@angular/core';
import { WatchedGroup } from '../../../../shared/services/user-session.service';

@Pipe({ name: 'itemProgressLabel', pure: true })
export class ItemProgressLabelPipe implements PipeTransform {
  transform(watchedGroup?: WatchedGroup): any {
    if (watchedGroup) {
      return $localize`Situation of ${ watchedGroup.name }`;
    }

    return $localize`Your situation`;
  }
}
