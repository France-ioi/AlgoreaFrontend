import {
  Component,
  OnInit,
  Input,
  ViewChild,
  Output,
  EventEmitter,
} from '@angular/core';
import { ensureDefined } from 'src/app/shared/helpers/null-undefined-predicates';

@Component({
  selector: 'alg-slider',
  templateUrl: './slider.component.html',
  styleUrls: [ './slider.component.scss' ],
})
export class SliderComponent implements OnInit {
  /**
   * Quite error-prone way to do a slider... should probably be re-written
   */

  @Input() ranges: number[] = [];
  @Input() min = 0;
  @Input() max = 100;
  @Input() showValue = false;
  @ViewChild('slider') slider?: HTMLDivElement;

  @Output() change = new EventEmitter<void>();

  posStart = 0;
  posEnd = 0;

  constructor() {}

  ngOnInit(): void {
    this.posStart = (ensureDefined(this.ranges[0]) * 100) / this.max;
    this.posEnd = (ensureDefined(this.ranges[1]) * 100) / this.max;
  }

  handleChange(): void {
    // const handles = this.slider.querySelectorAll('.p-slider-handle');
    // this.posStart = parseFloat(handles.item(0)...asna.style.left);
    // this.posEnd = parseFloat(handles[1].style.left);
    this.change.emit();
  }
}
