import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-yourself',
  templateUrl: './yourself.component.html',
  styleUrls: ['./yourself.component.scss']
})
export class YourselfComponent implements OnInit {

  scrolled;
  folded;
  isStarted;
  collapsed;

  constructor(
    private router: Router
  ) { }

  ngOnInit() {
    let param = history.state;
    this.scrolled = param.scrolled;
    this.folded = param.folded;
    this.isStarted = param.isStarted;
    this.collapsed = param.collapsed;
  }

  @HostListener('window:scroll', ['$event'])
  onScrollContent(e) {
    if (window.pageYOffset > 40 && !this.scrolled) {
      this.scrolled = true;
    } else if (window.pageYOffset <= 40 && this.scrolled) {
      this.scrolled = false;
    }
  }

}
