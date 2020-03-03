import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material";
import { AccessEditDialogComponent } from "src/app/basic-component/dialogs/access-edit-dialog/access-edit-dialog.component";

@Component({
  selector: "app-group-administration",
  templateUrl: "./group-administration.component.html",
  styleUrls: ["./group-administration.component.scss"]
})
export class GroupAdministrationComponent implements OnInit {
  cols = [
    { field: "manager_of", header: "Manager of..." },
    { field: "can_manage", header: "can_manage" },
    { field: "can_grant_access", header: "can_grant_group_access" },
    { field: "can_watch_activity", header: "can_watch_activity" },
    { field: "can_edit_personal_data", header: "can_edit_personal_data" }
  ];

  roles = [
    {
      user: "Aristide BRIAND",
      manager_of: "This group",
      can_manage: {
        progress: false,
        name: "+ group"
      },
      can_grant_access: true,
      can_watch_activity: true,
      can_edit_personal_data: true,
      comment: "This manager can access because he lorems ipsum dolor sit amet"
    },
    {
      user: "Egon SCHIELE",
      manager_of: "This group",
      can_manage: {
        progress: true,
        value: 2,
        name: "+ group"
      },
      can_grant_access: false,
      can_watch_activity: false,
      can_edit_personal_data: false,
      comment: "This manager can access because he lorems ipsum dolor sit amet"
    },
    {
      user: "Paul GAUGUIN",
      manager_of: "This group",
      can_manage: {
        progress: true,
        value: 3,
        name: "+ group"
      },
      can_grant_access: true,
      can_watch_activity: true,
      can_edit_personal_data: true,
      comment: "This manager can access because he lorems ipsum dolor sit amet"
    },
    {
      user: "Camile PISSARO",
      manager_of: "This group",
      can_manage: {
        progress: false,
        name: "+ group"
      },
      can_grant_access: true,
      can_watch_activity: true,
      can_edit_personal_data: true,
      comment: "This manager can access because he lorems ipsum dolor sit amet"
    }
  ];

  showComment = false;

  constructor(public dialog: MatDialog) {}

  ngOnInit() {}

  onCommentChanged(e) {
    this.showComment = e;
  }

  onEditAccess(e, idx) {
    const ref = this.dialog.open(AccessEditDialogComponent, {
      maxHeight: "1000px",
      minWidth: "800px",
      maxWidth: "800px",
      minHeight: "300px",
      data: {
        icon: "fa fa-lock",
        label: `Terminale B: manager access given to ${this.roles[idx].user}`,
        comment:
          "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.",
        sections: [
          {
            header: {
              icon: "fa fa-users-cog",
              title: "Can manage"
            },
            progress: true,
            values: [
              {
                field: "none",
                label: 'Nothing',
                comment: "User(s) can't invite/accept/reject members of this group."
              },
              {
                field: "memberships",
                label: "Memberships",
                comment: "User(s) can add and remove members in every possible way."
              },
              {
                field: "memberships_and_group",
                label: "Memberships and Group",
                comment: "User(s) can also make changes to the group and its parameters"
              }
            ],
            name: 'can_manage',
            active_until: 2
          },
          {
            header: {
              icon: "fa fa-key",
              title: "Can grant access"
            },
            progress: false,
            label: "User(s) can give memebers access to some items",
            name: 'can_grant_group_access',
            checked: false
          },
          {
            header: {
              icon: "fa fa-binoculars",
              title: "Can watch members"
            },
            progress: false,
            label: "User(s) can watch the members activity on some items",
            name: 'can_watch_members',
            checked: false
          },
          {
            header: {
              icon: "fa fa-user-edit",
              title: "Can edit personal data"
            },
            progress: false,
            label:
              "User(s) can edit the members personal data and password (if they agreed)",
            name: 'can_edit_personal_info',
            checked: false
          }
        ]
      }
    });

    ref.afterClosed().subscribe(result => {
      console.log(`Attach Group dialog result ${result}`);
    });
  }
}
