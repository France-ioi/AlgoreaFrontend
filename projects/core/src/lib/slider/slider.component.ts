import {
  Component,
  OnInit,
  Input,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
} from '@angular/core';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss'],
})
export class SliderComponent implements OnInit {
  @Input() ranges;
  @Input() min = 0;
  @Input() max = 100;
  @Input() showValue = false;
  @ViewChild('slider', { static: false }) slider: ElementRef;

  @Output() onChange = new EventEmitter<any>();

  posStart;
  posEnd;

  constructor() {}

  ngOnInit() {
    this.posStart = (this.ranges[0] * 100) / this.max;
    this.posEnd = (this.ranges[1] * 100) / this.max;
  }

  handleChange(e) {
    const handles = this.slider.nativeElement.querySelectorAll(
      '.ui-slider-handle'
    );

    this.posStart = parseFloat(handles[0].style.left);
    this.posEnd = parseFloat(handles[1].style.left);

    this.onChange.emit(e);
  }
}
