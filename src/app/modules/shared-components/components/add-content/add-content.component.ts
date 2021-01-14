import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface AddedContent<T> {
  id?: string,
  title: string,
  type: T,
}

export interface NewContentType<T> {
  type: T,
  icon: string,
  title: string,
  description: string,
}

const defaultFormValues = { create: '', searchExisting: '' };

@Component({
  selector: 'alg-add-content',
  templateUrl: './add-content.component.html',
  styleUrls: [ './add-content.component.scss' ],
})
export class AddContentComponent<Type, SearchedValue extends AddedContent<Type>> implements OnInit, OnDestroy {

  @Input() allowedTypesForNewContent: NewContentType<Type>[] = [];
  @Input() resultsFromSearch: SearchedValue[] = [];
  @Input() state: 'loading' | 'ready' = 'loading';

  @Output() search = new EventEmitter<string>();
  @Output() contentAdded = new EventEmitter<AddedContent<Type>>();

  readonly minInputLength = 3;

  addContentForm: FormGroup = this.formBuilder.group(defaultFormValues);
  trimmedInputsValue = defaultFormValues;

  focused?: 'create' | 'searchExisting';

  private subscriptions: Subscription[] = [];

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.addContentForm.valueChanges.subscribe((changes: typeof defaultFormValues) => {
        this.trimmedInputsValue = {
          create: changes.create.trim(),
          searchExisting: changes.searchExisting.trim(),
        };
      })
    );

    const existingTitleControl: Observable<string> | undefined = this.addContentForm.get('searchExisting')?.valueChanges;
    if (existingTitleControl) this.subscriptions.push(
      existingTitleControl.pipe(
        map(value => value.trim()),
        filter(value => this.checkLength(value)),
      ).subscribe(value => {
        this.search.emit(value);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onNewFocus(): void {
    if (this.focused === 'create') return;
    this.reset('create');
  }

  onExistingFocus(): void {
    if (this.focused === 'searchExisting') return;
    this.reset('searchExisting');
  }

  onBlur(): void {
    // Do not un-lighten the input if there is content in the other one
    if (this.focused === 'searchExisting' && this.trimmedInputsValue.searchExisting) return;
    if (this.focused === 'create' && this.trimmedInputsValue.create) return;
    this.focused = undefined;
  }

  addNew(type: Type): void {
    const title = this.trimmedInputsValue.create;
    if (!this.checkLength(title)) return;
    this.contentAdded.emit({
      title: title,
      type: type,
    });
    this.reset();
  }

  addExisting(item: SearchedValue): void {
    this.contentAdded.emit(item);
    this.reset();
  }

  private checkLength(s: string): boolean {
    return s.length >= this.minInputLength;
  }

  private reset(focused?: 'searchExisting' | 'create'): void {
    this.addContentForm.reset(defaultFormValues);
    this.focused = focused;
  }
}
