import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material';
import { EditUserDialogComponent } from 'src/app/basic-component/dialogs/edit-user-dialog/edit-user-dialog.component';

@Component({
  selector: 'app-group-composition',
  templateUrl: './group-composition.component.html',
  styleUrls: ['./group-composition.component.scss']
})
export class GroupCompositionComponent implements OnInit {

  @Input() gridData;
  @Input() columns;
  @Input() grdata;
  @Input() trees;
  @Input() groupTitle = "subgroups";
  @Input() forGroup = false;
  @Input() empty;
  
  @Output() expandWholeWidth = new EventEmitter<void>();

  selectedPolicy = 0;

  childrenPolicy = [
    {
      label: 'Direct Children Only'
    },
    {
      label: 'All descendants'
    }
  ];

  selItems = [
    {
      icon: 'fa fa-users',
      label: 'sub-groups'
    },
    {
      icon: 'fa fa-calendar',
      label: 'sessions'
    },
    {
      icon: 'fa fa-users',
      label: 'teams'
    },
    {
      icon: 'fa fa-user',
      label: 'users'
    }
  ];

  yesNo = [
    {
      label: 'Yes'
    },
    {
      label: 'No'
    }
  ];

  subgroup = [
    {
      label: 'School',
      icon: 'School.svg',
      disabled: true
    },
    {
      label: 'Class',
      icon: 'Group.svg'
    },
    {
      label: 'Folder',
      icon: 'Team.svg'
    },
    {
      label: 'Team',
      icon: 'Team.svg'
    }
  ];

  subgriddata = [
    {
      ID: 1,
      col1: 'Prefix-1',
      col2: '1356 generated codes',
      col3: '03/04/2018'
    },
    {
      ID: 2,
      col1: 'Prefix-2',
      col2: '1356 generated codes',
      col3: '03/04/2018'
    },
    {
      ID: 3,
      col1: 'Prefix-3',
      col2: '1356 generated codes',
      col3: '03/04/2018'
    },
    {
      ID: 4,
      col1: 'Prefix-4',
      col2: '1356 generated codes',
      col3: '03/04/2018'
    }
  ];

  subgridcols = ['col1', 'col2', 'col3'];
  statuses = [
    'requested',
    'invited',
    'member'
  ];

  showMsg = false;

  activateStatus = 2;

  constructor(
    private mainDialog: MatDialog
  ) { }

  ngOnInit() {
  }

  onChildrenPolicyChanged(idx) {
    this.selectedPolicy = idx;
  }

  onExpandWidth(e) {
    this.expandWholeWidth.emit(e);
  }

  onOpenDialog(e) {
    const dialogRef = this.mainDialog.open(EditUserDialogComponent, {
      maxHeight: '1000px',
      minWidth: '600px',
      maxWidth: '600px',
      minHeight: '200px',
      data: {
        icon: 'fa fa-pencil-alt',
        label: 'Quick edit user\'s details',
        status: this.statuses[Math.floor(Math.random() * 10) % 3],
        date: new Date(),
        comment: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.',
        grades: [
          { label: 'Terminale A', value: 'terminale' },
          { label: 'Terminale B', value: 'presentation' }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Main dialog returns ${result}`);
    })
  }

  onInvite(e) {
    this.showMsg = !this.showMsg;
  }

}
