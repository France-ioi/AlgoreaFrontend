import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { TreeNode } from "primeng/api";

@Component({
  selector: "app-selection-tree",
  templateUrl: "./selection-tree.component.html",
  styleUrls: ["./selection-tree.component.scss"],
})
export class SelectionTreeComponent implements OnInit, OnChanges {
  @Input() data: TreeNode[];

  constructor() {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (this.data) {
      while (this.data.length > 1) {
        this.data.pop();
      }
      if (this.data.length > 0) {
        this.data[0]["root"] = true;
        this.data[0]["expanded"] = true;
      }
    }
  }

  nodeExpand(event, node) {
    if (!node.expanded) {
      node.expanded = true;
    } else {
      node.expanded = false;
    }
  }

  nodeCheck(event, node) {
    if (!node.checked) {
      node.checked = true;
    } else {
      node.checked = false;
    }
  }
}
