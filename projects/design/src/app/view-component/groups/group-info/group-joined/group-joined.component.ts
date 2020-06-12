import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { JoinGroupDialogComponent } from 'core';

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
  ];

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
  ];

  invitationColumns = [
    { field: 'title', header: 'title' },
    { field: 'type', header: 'type' },
    { field: 'date', header: 'entry date' },
    { field: 'admins', header: 'admins' }
  ];

  invitationPanel = [
    {
      name: 'Invitation Info',
      columns: this.invitationColumns
    }
  ];

  constructor(
    public dialog: MatDialog
  ) { }

  ngOnInit() {
  }

  onExpandWidth(e) {

  }

  onJoinTeam(e) {
    const dialogRef = this.dialog.open(JoinGroupDialogComponent, {
      maxHeight: '83rem',
      minWidth: '50rem',
      maxWidth: '50rem',
      minHeight: '17rem',
      data: {
        group_name: 'Terminale A',
        desc: 'Group presentation Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
        administrators: [
          'Mathias HIRON',
          'Melanie STORUP',
          'Jean LUCAS'
        ],
        require_watch_approval: true,
        require_personal_info_access_approval: 'edit',
        require_lock_membership_approval_until: new Date()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Main dialog returns ${result}`);
    });
  }

}
