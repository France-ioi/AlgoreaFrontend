import { Component, ContentChild, EventEmitter, Input, Output, TemplateRef } from '@angular/core';

/**
 * This component is to be used in a `collapsible-section` component
 * ```
 * <alg-collapsible-section ... >
 *      <ng-template #content let-collapsed>
 *        <alg-switch-field
 *          [collapsed]="collapsed"
 *          ...
 *        ></alg-switch-field>
 *      </ng-template>
 *    </alg-collapsible-section>
 * ```
 */
@Component({
  selector: 'alg-switch-field',
  templateUrl: './switch-field.component.html',
  styleUrls: [ './switch-field.component.scss' ]
})
export class SwitchFieldComponent {

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
