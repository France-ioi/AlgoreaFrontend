import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-page-navigator',
  templateUrl: './page-navigator.component.html',
  styleUrls: ['./page-navigator.component.scss']
})
export class PageNavigatorComponent implements OnInit {

  @Input() allowFullScreen = 'false';
  @Input() navigationMode = 'nextAndPrev';

  constructor() { }

  ngOnInit() {
    console.log(this.allowFullScreen);
  }

}
