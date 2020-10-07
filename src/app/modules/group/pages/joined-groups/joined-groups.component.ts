import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'alg-joined-groups',
  templateUrl: './joined-groups.component.html',
  styleUrls: ['./joined-groups.component.scss']
})
export class JoinedGroupsComponent implements OnInit {
  title = 'Joined Groups'
  subtitle = 'Joined groups works !'

  constructor() { }

  ngOnInit(): void {
  }

}
