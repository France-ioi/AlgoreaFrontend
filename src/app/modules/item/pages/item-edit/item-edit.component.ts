import { Component, OnDestroy } from '@angular/core';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { ItemData, ItemDataSource } from '../../services/item-datasource.service';
import { FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { FetchError, Fetching, isReady, Ready } from '../../../../shared/helpers/state';


@Component({
  selector: 'alg-item-edit',
  templateUrl: './item-edit.component.html',
  styleUrls: ['./item-edit.component.scss']
})
export class ItemEditComponent implements OnDestroy {
  itemForm = this.formBuilder.group({
    // eslint-disable-next-line @typescript-eslint/unbound-method
    title: ['', [Validators.required, Validators.minLength(3),]],
  });
  itemLoadingState$ = this.itemDataSource.state$;

  itemSubscription: Subscription;

  constructor(
    private currentContent: CurrentContentService,
    private itemDataSource: ItemDataSource,
    private formBuilder: FormBuilder,
  ) {
    this.currentContent.editState.next('editing');
    this.getCurrentItem();
  }

  ngOnDestroy() {
    this.currentContent.editState.next('non-editable');
    this.itemSubscription.unsubscribe();
  }

  getCurrentItem(): void {
    this.itemSubscription = this.itemLoadingState$.pipe(
      filter<Ready<ItemData> | Fetching | FetchError, Ready<ItemData>>(isReady),
    ).subscribe(state => {
      const item = state.data.item;
      this.itemForm.patchValue({
        title: item.string.title
      });
    });
  }

}
