import { Component, OnInit, Output, EventEmitter } from "@angular/core";

@Component({
  selector: "app-search-input",
  templateUrl: "./search-input.component.html",
  styleUrls: ["./search-input.component.scss"],
})
export class SearchInputComponent implements OnInit {
  value = "";
  dirty = false;

  @Output() onChange = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {}

  onIconClicked(e) {
    if (this.dirty) {
      this.value = "";
      this.dirty = false;
      this.onClose.emit(e);
    } else {
      this.dirty = true;
      this.onChange.emit("");
    }
  }

  onValueChange(e) {
    if (e.length > 0) {
      this.dirty = true;
    } else {
      this.dirty = false;
    }
    this.onChange.emit(e);
  }

  onFocus(e) {
    this.onChange.emit("");
    this.dirty = true;
  }
}
