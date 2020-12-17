import { Component, Input, OnInit } from '@angular/core';
import { ProgressSectionComponent } from '../progress-section.component';

@Component({
  selector: 'alg-boolean-section',
  templateUrl: './boolean-section.component.html',
  styleUrls: [ './boolean-section.component.scss' ]
})
export class BooleanSectionComponent extends ProgressSectionComponent<boolean> implements OnInit {

  @Input() label?: string;

  value = false;

  ngOnInit(): void {
    if (this.defaultValue) {
      this.value = this.defaultValue;
    }
  }

  onSwitchChange(value: boolean): void {
    this.value = value;
    this.change.emit(this.value);
  }
}
