import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'alg-managed-groups',
  templateUrl: './managed-groups.component.html',
  styleUrls: ['./managed-groups.component.scss']
})
export class ManagedGroupsComponent implements OnInit {

  title = 'Groups you manage';
  subtitle = 'Here are the groups you manage';

  constructor() { }

  ngOnInit(): void {
  }

}
