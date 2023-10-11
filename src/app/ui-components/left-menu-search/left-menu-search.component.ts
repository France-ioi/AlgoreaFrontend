import { Component, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { distinctUntilChanged, map } from 'rxjs';
import { InputComponent } from 'src/app/ui-components/input/input.component';

@Component({
  selector: 'alg-left-menu-search',
  templateUrl: 'left-menu-search.component.html',
  styleUrls: [ 'left-menu-search.component.scss' ],
  standalone: true,
  imports: [ InputComponent ],
})
export class LeftMenuSearchComponent implements OnChanges {

  form = this.fb.group({
    search: [ '' ],
  });

  @Input() query = '';
  @Output() queryChange = this.form.valueChanges.pipe(
    map(value => value.search?.trim() ?? ''),
    distinctUntilChanged(),
  );

  constructor(
    private fb: FormBuilder,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.query) this.form.setValue({ search: this.query });
  }

}
