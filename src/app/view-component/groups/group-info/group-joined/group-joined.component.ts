import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-group-joined',
  templateUrl: './group-joined.component.html',
  styleUrls: ['./group-joined.component.scss']
})
export class GroupJoinedComponent implements OnInit {

  teamData = [
    {
      title: 'Team 1',
      members: 'Member 1, Member 2, Member 3',
      related_to: 'Lorem Ipsum',
      created_the: 'Lorem Ipsum'
    },
    {
      title: 'Team 2',
      members: 'Member 1, Member 2, Member 3',
      related_to: 'Lorem Ipsum',
      created_the: 'Lorem Ipsum'
    },
    {
      title: 'Team 3',
      members: 'Member 1, Member 2, Member 3',
      related_to: 'Lorem Ipsum',
      created_the: 'Lorem Ipsum'
    },
    {
      title: 'Team 4',
      members: 'Member 1, Member 2, Member 3',
      related_to: 'Lorem Ipsum',
      created_the: 'Lorem Ipsum'
    },
    {
      title: 'Team 5',
      members: 'Member 1, Member 2, Member 3',
      related_to: 'Lorem Ipsum',
      created_the: 'Lorem Ipsum'
    },
    {
      title: 'Team 6',
      members: 'Member 1, Member 2, Member 3',
      related_to: 'Lorem Ipsum',
      created_the: 'Lorem Ipsum'
    }
  ]

  teamColumns = [
    { field: 'title', header: 'title' },
    { field: 'members', header: 'members' },
    { field: 'related_to', header: 'related to' },
    { field: 'created_the', header: 'created the' }
  ];

  teamPanel = [
    {
      name: 'Team Info',
      columns: this.teamColumns
    }
  ];

  invitationData = [
    {
      title: 'Terminale A',
      type: 'Classe',
      date: new Date(),
      admins: 'Mathias, Melanie'
    },
    {
      title: 'Terminale B',
      type: 'Classe',
      date: new Date(),
      admins: 'Mathias'
    }
  ]

  invitationColumns = [
    { field: 'title', header: 'title' },
    { field: 'type', header: 'type' },
    { field: 'date', header: 'entry date' },
    { field: 'admins', header: 'admins' }
  ]

  invitationPanel = [
    {
      name: 'Invitation Info',
      columns: this.invitationColumns
    }
  ];

  constructor() { }

  ngOnInit() {
  }

  onExpandWidth(e) {
    
  }

}
