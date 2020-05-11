import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";

@Component({
  selector: "app-grid-gear",
  templateUrl: "./grid-gear.component.html",
  styleUrls: ["./grid-gear.component.scss"],
})
export class GridGearComponent implements OnInit {
  menuOpen = false;
  @Input() itemsAsRow = false;
  @Input() compactMode = false;
  @Input() freeze = true;
  @Input() sticky = true;
  @Input() showDescription = false;
  @Input() secondary = false;
  @Input() comment = false;

  @Output() compactChange = new EventEmitter<any>();
  @Output() frozenChange = new EventEmitter<any>();
  @Output() asRowChange = new EventEmitter<any>();
  @Output() showDescChange = new EventEmitter<any>();
  @Output() commentChange = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {}

  toggleGear(e) {
    this.menuOpen = !this.menuOpen;
  }

  handleSwitches(e, which) {
    switch (which) {
      // Row Column Swap
      case 0:
        this.asRowChange.emit(e);
        this.itemsAsRow = !this.itemsAsRow;
        break;
      // Compact Mode
      case 1:
        this.compactChange.emit(e);
        break;
      // Freeze first column
      case 2:
        this.frozenChange.emit(e);
        break;
      // Sticky header
      case 3:
        break;
      // Show descriptions
      case 4:
        this.showDescChange.emit(e);
      case 5:
        this.commentChange.emit(e);
        break;
      default:
    }
  }
}
