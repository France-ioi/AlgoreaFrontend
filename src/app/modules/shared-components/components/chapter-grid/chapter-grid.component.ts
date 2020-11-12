import { Component, OnInit, Input } from '@angular/core';
import { MatDialog } from '@angular/material';
import { AccessEditDialogComponent } from '../dialogs/access-edit-dialog/access-edit-dialog.component';

@Component({
  selector: 'app-chapter-grid',
  templateUrl: './chapter-grid.component.html',
  styleUrls: ['./chapter-grid.component.scss']
})
export class ChapterGridComponent implements OnInit {

  @Input() data;
  @Input() cols;
  @Input() scoreWeight;

  lockState = 1;
  icons = [
    'fa fa-lock',
    'fa fa-lock',
    'fa fa-lock'
  ];

  constructor(
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.data.forEach((itm, idx) => {
      itm.order = idx;
    });
  }

  openAdvancedDialog() {
    const ref = this.dialog.open(AccessEditDialogComponent, {
      maxHeight: "83rem",
      minWidth: "67rem",
      maxWidth: "67rem",
      minHeight: "25rem",
      data: {
        icon: "fa fa-lock",
        label: `Morbi sit amet eleifend tortor: propagation of access from Activity with mosaic view`,
        comment:
          "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.",
        sections: [
          {
            header: {
              icon: "fa fa-eye",
              title: "Default access"
            },
            progress: true,
            values: [
              {
                field: "none",
                label: 'Locked and hidden',
                comment: "Child is initially invisible to users who get content access to the chapter"
              },
              {
                field: "as_info",
                label: "Locked",
                comment: "Child is initially visible but locked to users who get content access to the chapter"
              },
              {
                field: "as_content",
                label: "Open",
                comment: "Child is accessible to users who get content access to the chaptert"
              }
            ],
            name: 'content_view_propagation',
            active_until: 2
          },
          {
            header: {
              icon: "fa fa-eye",
              title: "Extra view propagation"
            },
            progress: true,
            values: [
              {
                field: "use_content_view_propagation",
                label: 'Nothing',
                comment: "User(s) don't get any extra view access to this child, because on some extra view access they may have on the chapter."
              },
              {
                field: "as_content_with_descendants",
                label: "Content and descendants",
                comment: "User(s) get this view access (but not Solutions access) on this child if they have \"Content and descendants\" or \"Solutions\" access on the chapter."
              },
              {
                field: "as_is",
                label: "Same as parent",
                comment: "User(s) get the same extra access on this child, that they have on the chapter (\"Content and descendants\" or \"Solutions\")."
              }
            ],
            name: 'upper_view_levels_propagation',
            active_until: 1
          },
          {
            header: {
              icon: "fa fa-key",
              title: "Can grant view: propagation"
            },
            progress: false,
            label: "User(s) can grant the same access to this item as they can to the parent",
            name: 'grant_view_propagation',
            checked: false
          },
          {
            header: {
              icon: "fa fa-binoculars",
              title: "Can watch: propagation"
            },
            progress: false,
            label: "User(s) get the same \"Can watch\" access to this child as they do to the parent, except that \"Solutions and grant\" becomes \"Solutions\"",
            name: "watch_propagation",
            checked: false
          },
          {
            header: {
              icon: "fa fa-pencil-alt",
              title: "Can edit: propagation"
            },
            progress: false,
            label:
              "User(s) get the same \"Can edit\" access to this child as they do to the parent, except that \"All and grant\" becomes \"All\"",
            name: 'edit_propagation',
            checked: false
          }
        ]
      }
    });

    ref.afterClosed().subscribe(result => {
      console.log(`Attach Group dialog result ${result}`);
    });
  }

  menuSelected(e, idx, which) {
    switch (which) {
      case 0:
        this.icons[idx] = 'fa fa-eye-slash';
        break;
      case 1:
        this.icons[idx] = 'fa fa-lock';
        break;
      case 2:
        this.icons[idx] = 'fa fa-eye';
        break;
      case 3:
        this.openAdvancedDialog();
        break;
      default:
        break;
    }
  }

  lockMenuSelected(e, which) {
    this.lockState = which;
  }

}
