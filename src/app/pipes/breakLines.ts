import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'breakLines',
  pure: true,
  standalone: true
})
export class BreakLinesPipe implements PipeTransform {

  transform(text: string): string {
    return text.replace(/(\r\n|\n|\r)/gm, '<br>');
  }
}
