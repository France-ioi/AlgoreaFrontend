import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { map, filter, switchMap, debounceTime } from 'rxjs/operators';
import { ItemCorePerm } from '../../models/item-permissions';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { FetchState } from '../../utils/state';
import { ButtonModule } from 'primeng/button';
import { LoadingComponent } from '../loading/loading.component';
import { TooltipModule } from 'primeng/tooltip';
import { InputComponent } from '../input/input.component';
import { NgIf, NgClass, NgFor, SlicePipe } from '@angular/common';

export interface AddedContent<T> {
  id?: string,
  title: string,
  url?: string,
  type: T,
  permissions?: ItemCorePerm,
}

export interface NewContentType<T> {
  type: T,
  icon: string,
  title: string,
  description: string,
  allowToAddUrl?: boolean,
}

const defaultFormValues = { title: '', url: '', searchExisting: '' };

@Component({
  selector: 'alg-add-content',
  templateUrl: './add-content.component.html',
  styleUrls: [ './add-content.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    InputComponent,
    TooltipModule,
    NgClass,
    LoadingComponent,
    NgFor,
    ButtonModule,
    SlicePipe,
  ],
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
  @Input() isLight = false;

  @Output() contentAdded = new EventEmitter<AddedContent<Type>>();

  readonly minInputLength = 3;

  state?: FetchState<AddedContent<Type>[]>;
  addContentForm: UntypedFormGroup = this.formBuilder.group(defaultFormValues);
  trimmedInputsValue = defaultFormValues;

  focused?: 'create' | 'searchExisting';
  selected?: NewContentType<Type>;

  private subscriptions: Subscription[] = [];

  constructor(private formBuilder: UntypedFormBuilder) {}

  ngOnInit(): void {
    if (!this.searchFunction && this.showSearchUI) throw new Error('The input \'searchFunction\' is required');
    const searchFunction = this.searchFunction;

    this.subscriptions.push(
      this.addContentForm.valueChanges.subscribe((changes: typeof defaultFormValues) => {
        this.trimmedInputsValue = {
          title: changes.title.trim(),
          url: changes.url.trim(),
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
    if (this.focused === 'create' && this.trimmedInputsValue.title) return;
    this.focused = undefined;
  }

  onSelect(content: NewContentType<Type>): void {
    if (content.allowToAddUrl) {
      this.selected = content;
      return;
    }
    this.addNew(content.type);
  }

  addNew(type: Type): void {
    const title = this.trimmedInputsValue.title;
    const url = this.trimmedInputsValue.url;
    if (!this.checkLength(title)) return;
    this.contentAdded.emit({
      title,
      ...(url ? { url } : {}),
      type,
    });
  }

  addExisting(item: AddedContent<Type>): void {
    this.contentAdded.emit(item);
  }

  private checkLength(s: string): boolean {
    return s.length >= this.minInputLength;
  }

  reset(focused?: 'searchExisting' | 'create'): void {
    this.addContentForm.reset(defaultFormValues);
    this.focused = focused;
  }
}
