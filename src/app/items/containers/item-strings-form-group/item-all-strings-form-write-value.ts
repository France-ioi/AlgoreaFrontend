import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { StringsValue } from 'src/app/items/containers/item-strings-form-group/item-strings-control/item-strings-control.component';
import { AllStringsFormValue } from 'src/app/items/containers/item-strings-form-group/all-strings-form-value';
import {
  expandWithMissingLanguagePlaceholders,
  sortStringsValuesWithDefaultFirst,
} from 'src/app/items/containers/item-strings-form-group/item-all-strings-form.helpers';
import {
  addStringsFormControl,
  findStringsControlByTag,
  moveDefaultStringsControlToFirst,
} from 'src/app/items/containers/item-strings-form-group/item-all-strings-form-array';
import { ItemStringsLanguageLoader } from 'src/app/items/containers/item-strings-form-group/item-strings-language-loader';
import { CvaEcho } from 'src/app/utils/cva-echo';

export interface ApplyAllStringsWriteValueContext {
  fb: FormBuilder,
  form: FormGroup<{ allStrings: FormArray<FormControl<StringsValue>> }>,
  languageLoader: ItemStringsLanguageLoader,
  outboundEcho: CvaEcho<AllStringsFormValue>,
  itemSupportedLanguageTags: string[],
  defaultLanguageTag: string | undefined,
  resolvedLanguageTag: string,
  pendingDeletions: { set: (value: ReadonlySet<string>) => void },
  forceTabs: { set: (value: boolean) => void },
  activeLanguageTag: { set: (value: string) => void },
  syncFormArrayState: () => void,
  buildOutboundPayload: () => AllStringsFormValue,
  fetchLanguageIfNeeded: (languageTag: string) => void,
}

export function buildAllStringsWriteValueContext(
  component: Pick<
    ApplyAllStringsWriteValueContext,
    | 'fb'
    | 'form'
    | 'languageLoader'
    | 'outboundEcho'
    | 'itemSupportedLanguageTags'
    | 'defaultLanguageTag'
    | 'resolvedLanguageTag'
    | 'pendingDeletions'
    | 'forceTabs'
    | 'activeLanguageTag'
  > & {
    syncFormArrayState: () => void,
    buildOutboundPayload: () => AllStringsFormValue,
    fetchLanguageIfNeeded: (languageTag: string) => void,
  },
): ApplyAllStringsWriteValueContext {
  return {
    fb: component.fb,
    form: component.form,
    languageLoader: component.languageLoader,
    outboundEcho: component.outboundEcho,
    itemSupportedLanguageTags: component.itemSupportedLanguageTags,
    defaultLanguageTag: component.defaultLanguageTag,
    resolvedLanguageTag: component.resolvedLanguageTag,
    pendingDeletions: component.pendingDeletions,
    forceTabs: component.forceTabs,
    activeLanguageTag: component.activeLanguageTag,
    syncFormArrayState: component.syncFormArrayState,
    buildOutboundPayload: component.buildOutboundPayload,
    fetchLanguageIfNeeded: component.fetchLanguageIfNeeded,
  };
}

export function applyHostedAllStringsWriteValue(
  host: Parameters<typeof buildAllStringsWriteValueContext>[0],
  normalized: AllStringsFormValue,
): void {
  applyAllStringsWriteValue(buildAllStringsWriteValueContext(host), normalized);
}

export function applyAllStringsWriteValue(
  ctx: ApplyAllStringsWriteValueContext,
  normalized: AllStringsFormValue,
): void {
  const allStrings = ctx.form.controls.allStrings;
  const expandedValues = sortStringsValuesWithDefaultFirst(
    expandWithMissingLanguagePlaceholders(normalized.strings, ctx.itemSupportedLanguageTags),
    ctx.defaultLanguageTag ?? normalized.strings[0]?.languageTag ?? '',
  );

  ctx.pendingDeletions.set(new Set(normalized.pendingDeletions));
  ctx.forceTabs.set(false);
  ctx.languageLoader.clear();

  if (expandedValues.length < allStrings.length) {
    for (let i = allStrings.length; i > expandedValues.length; i--) {
      allStrings.removeAt(i - 1, { emitEvent: false });
    }
  }

  expandedValues.slice(allStrings.length).forEach(() => {
    addStringsFormControl(ctx.fb, allStrings, undefined, { emitEvent: false });
  });

  ctx.form.reset({ allStrings: expandedValues }, { emitEvent: false });
  allStrings.controls.forEach(c => c.enable({ emitEvent: false }));
  normalized.pendingDeletions.forEach(tag => {
    findStringsControlByTag(allStrings, tag)?.disable({ emitEvent: false });
  });

  const defaultTag = ctx.resolvedLanguageTag || expandedValues[0]?.languageTag || '';
  ctx.activeLanguageTag.set(defaultTag);
  ctx.syncFormArrayState();
  if (defaultTag) {
    moveDefaultStringsControlToFirst(allStrings, defaultTag);
    ctx.syncFormArrayState();
  }
  ctx.outboundEcho.rememberInbound(ctx.buildOutboundPayload());
  if (defaultTag) {
    ctx.fetchLanguageIfNeeded(defaultTag);
  }
}
