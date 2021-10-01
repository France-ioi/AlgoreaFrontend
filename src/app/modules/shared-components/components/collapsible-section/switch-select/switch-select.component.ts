import { Component, ContentChild, EventEmitter, Input, Output, TemplateRef } from '@angular/core';

/**
 * This component is to be used in a `collapsible-section` component
 * ```
 * <alg-collapsible-section ... >
 *      <ng-template #content let-collapsed>
 *        <alg-switch-select
 *          [collapsed]="collapsed"
 *          ...
 *        ></alg-switch-select>
 *      </ng-template>
 *    </alg-collapsible-section>
 * ```
 */
@Component({
  selector: 'alg-switch-select',
  templateUrl: './switch-select.component.html',
  styleUrls: [ './switch-select.component.scss' ]
})
export class SwitchSelectComponent {

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
