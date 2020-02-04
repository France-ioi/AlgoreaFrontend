import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-switch-container',
  templateUrl: './switch-container.component.html',
  styleUrls: ['./switch-container.component.scss']
})
export class SwitchContainerComponent implements OnInit {

  @Input() label;
  @Input() checked: boolean;
  @Input() title;

  visible = true;

  constructor() { }

  ngOnInit() {
    this.visible = this.checked;
  }

  onChange(e) {
    console.log(e);
    this.visible = e;
  }

}
