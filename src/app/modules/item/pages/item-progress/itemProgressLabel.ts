import { Pipe, PipeTransform } from '@angular/core';
import { Group } from '../../../group/http-services/get-group-by-id.service';

@Pipe({ name: 'itemProgressLabel' })
export class ItemProgressLabelPipe implements PipeTransform {
  transform(type: string, watchedGroup?: Group): any {
    if (!!watchedGroup && [ 'Chapter', 'Task', 'Course' ].includes(type)) {
      return $localize`Situation of ${ watchedGroup.name }`;
    }

    return $localize`Your situation`;
  }
}
