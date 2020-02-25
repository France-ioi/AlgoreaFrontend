import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { JoinGroupDialogComponent } from 'src/app/basic-component/dialogs/join-group-dialog/join-group-dialog.component';

@Component({
  selector: 'app-access-code-view',
  templateUrl: './access-code-view.component.html',
  styleUrls: ['./access-code-view.component.scss']
})
export class AccessCodeViewComponent implements OnInit {

  constructor(
    private dialog: MatDialog
  ) { }

  ngOnInit() {
  }

  onJoinTeam(e) {
    const dialogRef = this.dialog.open(JoinGroupDialogComponent, {
      maxHeight: '1000px',
      minWidth: '600px',
      maxWidth: '600px',
      minHeight: '200px',
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
