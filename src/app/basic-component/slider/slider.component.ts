import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss']
})
export class SliderComponent implements OnInit {

  @Input() ranges;
  @Input() min = 0;
  @Input() max = 100;
  @Input() showValue = false;
  @ViewChild('slider', { static: false }) slider: ElementRef;

  posStart;
  posEnd;

  constructor() { }

  ngOnInit() {
    this.posStart = this.ranges[0] * 100 / this.max;
    this.posEnd = this.ranges[1] * 100 / this.max;
    console.log(this.max);
  }

  handleChange(e) {
    var handles = this.slider.nativeElement.querySelectorAll('.ui-slider-handle');

    console.log(handles[1].style.left);
    this.posStart = parseFloat(handles[0].style.left);
    this.posEnd = parseFloat(handles[1].style.left);
  }

}
