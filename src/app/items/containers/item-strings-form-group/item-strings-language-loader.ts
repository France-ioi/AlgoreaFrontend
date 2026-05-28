import { inject, DestroyRef, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { GetItemByIdService } from 'src/app/data-access/get-item-by-id.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import {
  itemToStringsValue,
} from 'src/app/items/containers/item-strings-form-group/item-all-strings-form.helpers';
import { StringsValue } from 'src/app/items/containers/item-strings-form-group/item-strings-control/item-strings-control.component';

export interface LanguageFetchContext {
  itemId: string,
  languageTag: string,
  control: FormControl<StringsValue>,
  isLoaded: (languageTag: string) => boolean,
  isOnServer: (languageTag: string) => boolean,
  onLoaded: (value: StringsValue) => void,
  onSettled: () => void,
}

@Injectable()
export class ItemStringsLanguageLoader {
  private getItemByIdService = inject(GetItemByIdService);
  private actionFeedbackService = inject(ActionFeedbackService);
  private destroyRef = inject(DestroyRef);

  readonly loadingLanguages = signal<ReadonlySet<string>>(new Set());
  readonly failedLanguages = signal<ReadonlySet<string>>(new Set());

  private activeRequests = new Map<string, Subscription>();
  private lastContext = new Map<string, LanguageFetchContext>();

  clear(): void {
    // Drop in-flight requests and cached contexts so `retry()` cannot resurrect a stale
    // `FormControl` after `writeValue` rebuilds the form array (callers re-fetch immediately).
    for (const sub of this.activeRequests.values()) sub.unsubscribe();
    this.activeRequests.clear();
    this.lastContext.clear();
    this.loadingLanguages.set(new Set());
    this.failedLanguages.set(new Set());
  }

  fetchIfNeeded(context: LanguageFetchContext): void {
    const { languageTag } = context;
    if (context.isLoaded(languageTag) || !context.isOnServer(languageTag)) return;

    const value = context.control.getRawValue();
    if (value.title || value.subtitle || value.description) return;
    if (this.loadingLanguages().has(languageTag)) return;

    this.failedLanguages.update(set => {
      if (!set.has(languageTag)) return set;
      const next = new Set(set);
      next.delete(languageTag);
      return next;
    });
    this.lastContext.set(languageTag, context);
    this.startRequest(context);
  }

  retry(languageTag: string): void {
    const context = this.lastContext.get(languageTag);
    if (!context) return;
    this.fetchIfNeeded(context);
  }

  private startRequest(context: LanguageFetchContext): void {
    const { itemId, languageTag, control, onLoaded, onSettled } = context;
    this.activeRequests.get(languageTag)?.unsubscribe();

    this.loadingLanguages.update(set => new Set(set).add(languageTag));
    const sub = this.getItemByIdService.get(itemId, { languageTag }).pipe(
      finalize(() => this.finishRequest(languageTag, onSettled)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: item => {
        const stringsValue = itemToStringsValue(item);
        control.patchValue(stringsValue, { emitEvent: false });
        onLoaded(stringsValue);
      },
      error: () => {
        this.failedLanguages.update(set => new Set(set).add(languageTag));
        this.actionFeedbackService.error(
          $localize`Could not load the ${languageTag.toUpperCase()}:languageTag: translation. Please try again.`,
        );
      },
    });
    this.activeRequests.set(languageTag, sub);
  }

  private finishRequest(languageTag: string, onSettled: () => void): void {
    this.activeRequests.delete(languageTag);
    this.loadingLanguages.update(set => {
      const next = new Set(set);
      next.delete(languageTag);
      return next;
    });
    onSettled();
  }
}
