import { Component, OnInit, Input } from '@angular/core';
import { MatDialog } from '@angular/material';
import { MatDialogComponent } from '../mat-dialog/mat-dialog.component';

@Component({
  selector: 'app-activity-picker',
  templateUrl: './activity-picker.component.html',
  styleUrls: ['./activity-picker.component.scss']
})
export class ActivityPickerComponent implements OnInit {

  selected = 'Select an activity';

  @Input() trees;

  show = false;

  constructor(
    public dialog: MatDialog
  ) { }

  ngOnInit() {
  }

  openDialog(e) {
    const dialogRef = this.dialog.open(MatDialogComponent, {
      maxHeight: '1000px',
      minWidth: '600px',
      minHeight: '200px',
      data: {
        trees: this.trees,
        icon: 'fa fa-folder',
        label: 'Select a content'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }

}
