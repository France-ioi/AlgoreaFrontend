import { Pipe, PipeTransform } from '@angular/core';

/**
 * Converts a timestamp (number in milliseconds) to a Date object.
 * Useful for chaining with other date pipes like relativeTime.
 */
@Pipe({ name: 'toDate', pure: true })
export class ToDatePipe implements PipeTransform {
  transform(value: number): Date {
    return new Date(value);
  }
}
