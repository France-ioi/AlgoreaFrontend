import { Pipe, PipeTransform } from '@angular/core';
import { Group } from '../../../group/http-services/get-group-by-id.service';
import { ItemType } from '../../../../shared/helpers/item-type';

@Pipe({ name: 'itemProgressLabel' })
export class ItemProgressLabelPipe implements PipeTransform {
  transform(type: ItemType, watchedGroup?: Group): any {
    if (!!watchedGroup && [ 'Chapter', 'Task', 'Course' ].includes(type)) {
      return $localize`Situation of ${ watchedGroup.name }`;
    }

    return $localize`Your situation`;
  }
}
