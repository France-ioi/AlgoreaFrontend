import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'alg-left-menu-search',
  templateUrl: 'left-menu-search.component.html',
  styleUrls: [ 'left-menu-search.component.scss' ],
})
export class LeftMenuSearchComponent {
  form = this.fb.group({
    search: [ '' ],
  });

  constructor(private fb: FormBuilder) {
  }
}
