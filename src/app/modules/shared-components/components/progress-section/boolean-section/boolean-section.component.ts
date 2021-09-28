import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * To add a label to the switch, just add an element inside.
 * A description can also be provided with an element with the `description` attribute
 * For example:
 * ```html
 * <alg-boolean-section>
 *   <p description> description </p>
 *   <p> label </p>
 * </alg-boolean-section>
 * ```
 */
@Component({
  selector: 'alg-boolean-section',
  templateUrl: './boolean-section.component.html',
  styleUrls: [ './boolean-section.component.scss' ]
})
export class BooleanSectionComponent {

  @Input() title = '';
  @Input() icon = '';

  @Input() value = false;
  @Input() collapsible = true;
  @Input() collapsed = true;

  @Output() valueChange = new EventEmitter<boolean>();

  constructor() { }

  onSet(val: boolean): void {
    this.value = val;
    this.valueChange.emit(this.value);
  }
}
