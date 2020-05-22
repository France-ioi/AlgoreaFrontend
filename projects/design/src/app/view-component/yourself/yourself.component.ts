import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { EditService } from '../../services/edit.service';

@Component({
  selector: 'app-yourself',
  templateUrl: './yourself.component.html',
  styleUrls: ['./yourself.component.scss']
})
export class YourselfComponent implements OnInit {

  status;

  constructor(
    private router: Router,
    private editService: EditService
  ) { }

  ngOnInit() {
    const param = history.state;
    this.editService.getOb().subscribe(res => {
      this.status = res;
    });
  }

  @HostListener('window:scroll', ['$event'])
  onScrollContent(e) {
    if (window.pageYOffset > 40 && !this.status.scrolled) {
      this.status.scrolled = true;
    } else if (window.pageYOffset <= 40 && this.status.scrolled) {
      this.status.scrolled = false;
    }
  }

}
