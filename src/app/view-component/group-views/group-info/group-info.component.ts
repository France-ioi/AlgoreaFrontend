import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

@Component({
  selector: 'app-group-info',
  templateUrl: './group-info.component.html',
  styleUrls: ['./group-info.component.scss']
})
export class GroupInfoComponent implements OnInit {

  title;
  subtitle;
  showJoined = false;

  constructor(
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit() {

    this.activatedRoute.data.subscribe(data => {
      this.showJoined = data.src !== 'managed';

      if (this.showJoined) {
        this.title = 'Groups you joined';
        this.subtitle = 'Here are the groups you joined, you can leave them ore add new ones, lorem ipsum dolor sit amet';
      } else {
        this.title = 'Groups you manage';
        this.subtitle = 'Here are the groups you manage, you can leave them ore add new ones, lorem ipsum dolor sit amet';
      }
    });
  }

  onExpandWidth(e) {

  }

}
