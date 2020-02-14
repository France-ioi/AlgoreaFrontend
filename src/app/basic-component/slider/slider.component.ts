import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss']
})
export class SliderComponent implements OnInit {

  @Input() ranges;
  @ViewChild('slider', { static: false }) slider: ElementRef;

  posStart;
  posEnd;

  constructor() { }

  ngOnInit() {
    this.posStart = this.ranges[0];
    this.posEnd = this.ranges[1];
  }

  handleChange(e) {
    var handles = this.slider.nativeElement.querySelectorAll('.ui-slider-handle');

    console.log(handles[0].style.left);
    this.posStart = parseFloat(handles[0].style.left);
    this.posEnd = parseFloat(handles[1].style.left);
  }

}
