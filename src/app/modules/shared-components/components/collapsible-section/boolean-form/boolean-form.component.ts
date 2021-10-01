import { Component, ContentChild, EventEmitter, Input, Output, TemplateRef } from '@angular/core';

/**
 * This component is to be used in a `collapsible-section` component
 * ```
 * <alg-collapsible-section ... >
 *      <ng-template #content let-collapsed>
 *        <alg-boolean-form
 *          [collapsed]="collapsed"
 *          ...
 *        ></alg-boolean-form>
 *      </ng-template>
 *    </alg-collapsible-section>
 * ```
 */
@Component({
  selector: 'alg-boolean-form',
  templateUrl: './boolean-form.component.html',
  styleUrls: [ './boolean-form.component.scss' ]
})
export class BooleanFormComponent {

  @Input() value = false;
  @Input() collapsed = false;

  @ContentChild('description') descriptionTemplate?: TemplateRef<any>;
  @ContentChild('label') labelTemplate?: TemplateRef<any>;

  @Output() valueChange = new EventEmitter<boolean>();

  constructor() { }

  onSet(val: boolean): void {
    this.value = val;
    this.valueChange.emit(this.value);
  }
}
