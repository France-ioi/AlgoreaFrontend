import { Component, OnInit, Input } from "@angular/core";
import { MatDialog } from "@angular/material";
import { MatDialogComponent } from "../mat-dialog/mat-dialog.component";

@Component({
  selector: "app-activity-picker",
  templateUrl: "./activity-picker.component.html",
  styleUrls: ["./activity-picker.component.scss"],
})
export class ActivityPickerComponent implements OnInit {
  @Input() selected = "Select an activity";

  @Input() trees;

  show = false;

  constructor(public dialog: MatDialog) {}

  ngOnInit() {}

  openDialog(e) {
    const dialogRef = this.dialog.open(MatDialogComponent, {
      maxHeight: "83rem",
      minWidth: "50rem",
      data: {
        trees: this.trees,
        icon: "fa fa-folder",
        label: "Select a content",
      },
    });

    dialogRef.afterClosed().subscribe((result) => {});
  }
}
