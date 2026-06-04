import {
  afterNextRender,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  output,
  ChangeDetectionStrategy
} from '@angular/core';
import { outputFromObservable } from '@angular/core/rxjs-interop';
import { FormBuilder } from '@angular/forms';
import { distinctUntilChanged, map } from 'rxjs';
import { InputComponent } from 'src/app/ui-components/input/input.component';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';

@Component({
  selector: 'alg-left-menu-search',
  templateUrl: 'left-menu-search.component.html',
  styleUrls: [ 'left-menu-search.component.scss' ],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ InputComponent, ButtonIconComponent ],
})
export class LeftMenuSearchComponent {
  private fb = inject(FormBuilder);
  private elementRef = inject(ElementRef);

  query = input('');
  close = output<void>();

  form = this.fb.group({
    search: [ '' ],
  });

  queryChange = outputFromObservable(
    this.form.valueChanges.pipe(
      map(value => value.search?.trim() ?? ''),
      distinctUntilChanged(),
    ),
  );

  constructor() {
    effect(() => {
      this.form.setValue({ search: this.query() }, { emitEvent: false });
    });

    afterNextRender(() => {
      const host = this.elementRef.nativeElement as HTMLElement;
      host.querySelector<HTMLInputElement>('input')?.focus();
    });
  }
}
