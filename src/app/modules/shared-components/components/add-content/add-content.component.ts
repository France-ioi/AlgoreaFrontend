import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { map, filter, switchMap, debounceTime } from 'rxjs/operators';
import { ItemCorePerm } from 'src/app/shared/models/domain/item-permissions';
import { mapToFetchState } from 'src/app/shared/operators/state';
import { FetchState } from '../../../../shared/helpers/state';

export interface AddedContent<T> {
  id?: string,
  title: string,
  type: T,
  permissions?: ItemCorePerm,
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
export class AddContentComponent<Type> implements OnInit, OnDestroy {
  @Input() allowedTypesForNewContent: NewContentType<Type>[] = [];
  @Input() searchFunction?: (searchValue: string) => Observable<AddedContent<Type>[]>;
  @Input() loading = false;
  @Input() addedIds: string[] = [];
  @Input() selectExistingText: string = $localize`Add`;
  @Input() addedText: string = $localize`Already added`;
  @Input() inputCreatePlaceholder = $localize`Enter a title to create a new child`;
  @Input() showCreateUI = true;
  @Input() showSearchUI = true;

  @Output() contentAdded = new EventEmitter<AddedContent<Type>>();

  readonly minInputLength = 3;

  state?: FetchState<AddedContent<Type>[]>;
  addContentForm: UntypedFormGroup = this.formBuilder.group(defaultFormValues);
  trimmedInputsValue = defaultFormValues;

  focused?: 'create' | 'searchExisting';

  private subscriptions: Subscription[] = [];

  constructor(private formBuilder: UntypedFormBuilder) {}

  ngOnInit(): void {
    if (!this.searchFunction && this.showSearchUI) throw new Error('The input \'searchFunction\' is required');
    const searchFunction = this.searchFunction;

    this.subscriptions.push(
      this.addContentForm.valueChanges.subscribe((changes: typeof defaultFormValues) => {
        this.trimmedInputsValue = {
          create: changes.create.trim(),
          searchExisting: changes.searchExisting.trim(),
        };
      })
    );

    if (!searchFunction) {
      return;
    }

    const existingTitleControl: Observable<string> | undefined = this.addContentForm.get('searchExisting')?.valueChanges;
    if (existingTitleControl) this.subscriptions.push(
      existingTitleControl.pipe(
        map(value => value.trim()),
        filter(value => this.checkLength(value)),
        debounceTime(300),
        switchMap(value => searchFunction(value).pipe(mapToFetchState())),
      ).subscribe(state =>
        this.state = state
      )
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

  addExisting(item: AddedContent<Type>): void {
    this.contentAdded.emit(item);
  }

  private checkLength(s: string): boolean {
    return s.length >= this.minInputLength;
  }

  private reset(focused?: 'searchExisting' | 'create'): void {
    this.addContentForm.reset(defaultFormValues);
    this.focused = focused;
  }
}
