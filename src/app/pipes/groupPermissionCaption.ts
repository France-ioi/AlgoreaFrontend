import { Pipe, PipeTransform } from '@angular/core';

const PERMISSION_CAPTIONS = {
  none: $localize`None`,
  children: $localize`Children`,
  all: $localize`All`,
  all_with_grant: $localize`All with grant`,
  enter: $localize`Enter`,
  content: $localize`Content`,
  content_with_descendants: $localize`Content with descendants`,
  solution: $localize`Solution`,
  solution_with_grant: $localize`Solution with grant`,
  info: $localize`Info`,
  result: $localize`Result`,
  answer: $localize`Answer`,
  answer_with_grant: $localize`Answer with grant`,
};

@Pipe({
  name: 'groupPermissionCaption', pure: true,
  standalone: true
})
export class GroupPermissionCaptionPipe implements PipeTransform {
  transform(value: keyof typeof PERMISSION_CAPTIONS): string {
    return PERMISSION_CAPTIONS[value] ?? $localize`No caption`;
  }
}
