import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { ItemAllStringsFormComponent } from './item-all-strings-form.component';
import { APPCONFIG } from 'src/app/config';
import { GetItemByIdService, Item } from 'src/app/data-access/get-item-by-id.service';
import { StringsValue } from './item-strings-control/item-strings-control.component';
import { formatLanguageTagDisplay } from './item-all-strings-form.helpers';
import { AllStringsFormValue, applyLocalCommitToFormValue } from './all-strings-form-value';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';

const multiLangConfig = {
  languages: [ { tag: 'en' }, { tag: 'fr' } ],
};

const monoLangConfig = {
  languages: [ { tag: 'en' } ],
};

const defaultStringsValue: StringsValue = {
  languageTag: 'en',
  title: 'Title',
  subtitle: '',
  description: '',
};

describe('ItemAllStringsFormComponent', () => {
  let fixture: ComponentFixture<ItemAllStringsFormComponent>;
  let component: ItemAllStringsFormComponent;
  let getItemByIdService: jasmine.SpyObj<GetItemByIdService>;

  async function setup(config: { languages: { tag: string }[] }): Promise<void> {
    getItemByIdService = jasmine.createSpyObj<GetItemByIdService>('GetItemByIdService', [ 'get' ]);

    await TestBed.configureTestingModule({
      imports: [ ItemAllStringsFormComponent, ReactiveFormsModule ],
      providers: [
        { provide: APPCONFIG, useValue: config },
        { provide: GetItemByIdService, useValue: getItemByIdService },
        { provide: ActionFeedbackService, useValue: { success: () => {}, error: () => {}, unexpectedError: () => {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemAllStringsFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('supportedLanguages', config.languages.map(l => l.tag));
    fixture.componentRef.setInput('defaultLanguageTag', 'en');
    fixture.componentRef.setInput('itemId', 'item-1');
    fixture.componentRef.setInput('itemSupportedLanguageTags', [ 'en' ]);
    fixture.componentRef.setInput('loadedLanguageTags', [ 'en' ]);
    component.writeValue([ defaultStringsValue ]);
    fixture.detectChanges();
  }

  it('does not notify the parent when writeValue runs', async () => {
    await setup(multiLangConfig);
    const onChange = jasmine.createSpy<(value: AllStringsFormValue | null) => void>('onChange');
    component.registerOnChange(onChange);
    component.writeValue([ defaultStringsValue ]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('notifies the parent when the user changes a field', async () => {
    await setup(multiLangConfig);
    const onChange = jasmine.createSpy<(value: AllStringsFormValue | null) => void>('onChange');
    component.registerOnChange(onChange);
    component.writeValue([ defaultStringsValue ]);
    onChange.calls.reset();
    component.allStrings.at(0).patchValue({ ...defaultStringsValue, title: 'New title' }, { emitEvent: true });
    fixture.detectChanges();
    expect(onChange).toHaveBeenCalledWith(jasmine.objectContaining({
      strings: [ jasmine.objectContaining({ title: 'New title' }) ],
    }));
  });

  it('does not notify the parent when child fields echo the initial value (mono item)', async () => {
    await setup(monoLangConfig);
    fixture.componentRef.setInput('itemSupportedLanguageTags', [ 'en' ]);
    const onChange = jasmine.createSpy<(value: AllStringsFormValue | null) => void>('onChange');
    component.registerOnChange(onChange);
    component.writeValue([ defaultStringsValue ]);
    onChange.calls.reset();
    fixture.detectChanges();
    component.allStrings.at(0).patchValue({ ...defaultStringsValue }, { emitEvent: true });
    fixture.detectChanges();
    expect(onChange).not.toHaveBeenCalled();
    expect(component.state()).toBe('mono');
  });

  it('displays language tags in upper case', () => {
    expect(formatLanguageTagDisplay('fr')).toBe('FR');
    expect(formatLanguageTagDisplay('en')).toBe('EN');
  });

  it('uses mono state when the platform has a single language', async () => {
    await setup(monoLangConfig);
    expect(component.state()).toBe('mono');
  });

  it('uses single state for a monolingual item on a multilingual platform', async () => {
    await setup(multiLangConfig);
    expect(component.state()).toBe('single');
  });

  it('switches to tabs when the translate CTA is clicked', async () => {
    await setup(multiLangConfig);
    component.onShowTabs();
    fixture.detectChanges();
    expect(component.state()).toBe('tabs');
  });

  it('uses tabs when the item supports multiple server languages', async () => {
    await setup(multiLangConfig);
    fixture.componentRef.setInput('itemSupportedLanguageTags', [ 'en', 'fr' ]);
    component.writeValue([ defaultStringsValue ]);
    fixture.detectChanges();
    expect(component.state()).toBe('tabs');
    expect(component.tabLanguageTags()).toEqual([ 'en', 'fr' ]);
  });

  it('uses tabs when multiple languages are present', async () => {
    await setup(multiLangConfig);
    component.writeValue([
      defaultStringsValue,
      { ...defaultStringsValue, languageTag: 'fr', title: 'Titre' },
    ]);
    fixture.detectChanges();
    expect(component.state()).toBe('tabs');
  });

  it('clears tab error state after undoing pending deletion on a valid language', async () => {
    await setup(multiLangConfig);
    component.writeValue([
      defaultStringsValue,
      { ...defaultStringsValue, languageTag: 'fr', title: 'Titre FR' },
    ]);
    component.onShowTabs();
    fixture.detectChanges();

    component.onTogglePendingDeletion('fr');
    expect(component.invalidLanguageTags().has('fr')).toBeFalse();

    component.onTogglePendingDeletion('fr');
    expect(component.invalidLanguageTags().has('fr')).toBeFalse();
    expect(component.pendingDeletions().has('fr')).toBeFalse();
  });

  it('toggles pending deletion and excludes the language from outbound value', async () => {
    await setup(multiLangConfig);
    component.writeValue([
      defaultStringsValue,
      { ...defaultStringsValue, languageTag: 'fr', title: 'Titre' },
    ]);
    fixture.detectChanges();

    const emitted: AllStringsFormValue[] = [];
    component.registerOnChange(v => {
      if (v) emitted.push(v);
    });

    component.onTogglePendingDeletion('fr');
    expect(component.pendingDeletions().has('fr')).toBeTrue();
    expect(emitted.at(-1)?.strings.some(v => v.languageTag === 'fr')).toBeFalse();

    component.onTogglePendingDeletion('fr');
    expect(component.pendingDeletions().has('fr')).toBeFalse();
    expect(emitted.at(-1)?.strings.some(v => v.languageTag === 'fr')).toBeTrue();
  });

  it('fetches the default language on load when it is not in the initial values', async () => {
    await setup(multiLangConfig);
    fixture.componentRef.setInput('defaultLanguageTag', 'en');
    fixture.componentRef.setInput('itemSupportedLanguageTags', [ 'en', 'fr' ]);
    fixture.componentRef.setInput('loadedLanguageTags', [ 'fr' ]);
    getItemByIdService.get.and.returnValue(of({
      string: {
        languageTag: 'en',
        title: 'Loaded EN',
        subtitle: '',
        description: '',
      },
    } as Item));

    component.writeValue([ { ...defaultStringsValue, languageTag: 'fr', title: 'Titre FR' } ]);
    fixture.detectChanges();

    expect(getItemByIdService.get).toHaveBeenCalledWith('item-1', { languageTag: 'en' });
    expect(component.allStrings.at(0).getRawValue().title).toBe('Loaded EN');
  });

  it('places the default language first when loading strings', async () => {
    await setup(multiLangConfig);
    fixture.componentRef.setInput('defaultLanguageTag', 'en');
    fixture.componentRef.setInput('itemSupportedLanguageTags', [ 'en', 'fr' ]);
    component.writeValue([ { ...defaultStringsValue, languageTag: 'fr', title: 'Titre FR' } ]);
    component.onShowTabs();
    fixture.detectChanges();
    expect(component.tabLanguageTags()).toEqual([ 'en', 'fr' ]);
    expect(component.allStrings.at(0).getRawValue().languageTag).toBe('en');
  });

  it('moves the chosen language to the first tab when set as default', async () => {
    await setup(multiLangConfig);
    component.writeValue([
      defaultStringsValue,
      { ...defaultStringsValue, languageTag: 'fr', title: 'Titre' },
    ]);
    component.onShowTabs();
    fixture.detectChanges();

    component.onSetDefaultLanguage('fr');
    expect(component.allStrings.at(0).getRawValue().languageTag).toBe('fr');
    expect(component.activeLanguageTag()).toBe('fr');
  });

  it('does not list a pending-deletion language in the add tab', async () => {
    await setup(multiLangConfig);
    component.writeValue([
      defaultStringsValue,
      { ...defaultStringsValue, languageTag: 'fr', title: 'Titre' },
    ]);
    component.onShowTabs();
    expect(component.missingLanguages()).toEqual([]);

    component.onTogglePendingDeletion('fr');
    expect(component.missingLanguages()).toEqual([]);
    expect(component.tabLanguageTags()).toEqual([ 'en', 'fr' ]);
  });

  it('recomputes missing languages for the add tab', async () => {
    await setup(multiLangConfig);
    component.onShowTabs();
    expect(component.missingLanguages()).toEqual([ 'fr' ]);

    component.onAddLanguage('fr');
    expect(component.missingLanguages()).toEqual([]);
    expect(component.activeLanguageTag()).toBe('fr');
  });

  it('drops a locally-added pending-deletion tab when writeValue receives a committed payload', async () => {
    await setup(multiLangConfig);
    component.writeValue([ defaultStringsValue ]);
    component.onShowTabs();
    component.onAddLanguage('fr');
    component.onTogglePendingDeletion('fr');

    const { value: committed } = applyLocalCommitToFormValue(
      { strings: [ defaultStringsValue ], pendingDeletions: [ 'fr' ] },
      [ 'en' ],
    );
    component.writeValue(committed);
    expect(component.tabLanguageTags()).toEqual([ 'en' ]);
    expect(component.pendingDeletions().has('fr')).toBeFalse();
  });

  it('lazy-fetches a language on first tab activation', async () => {
    await setup(multiLangConfig);
    fixture.componentRef.setInput('itemSupportedLanguageTags', [ 'en', 'fr' ]);
    getItemByIdService.get.and.returnValue(of({
      string: {
        languageTag: 'fr',
        title: 'Loaded fr',
        subtitle: '',
        description: '',
      },
    } as Item));

    component.writeValue([
      defaultStringsValue,
      { ...defaultStringsValue, languageTag: 'fr', title: '' },
    ]);
    component.onShowTabs();
    component.onActiveTabChange('fr');
    fixture.detectChanges();

    expect(getItemByIdService.get).toHaveBeenCalledWith('item-1', { languageTag: 'fr' });
    expect(component.allStrings.controls.find(c => c.getRawValue().languageTag === 'fr')?.getRawValue().title)
      .toBe('Loaded fr');
  });

  it('does not mark unloaded server language placeholders as invalid', async () => {
    await setup(multiLangConfig);
    fixture.componentRef.setInput('itemSupportedLanguageTags', [ 'en', 'fr' ]);
    fixture.componentRef.setInput('loadedLanguageTags', [ 'en' ]);
    component.writeValue([ defaultStringsValue ]);
    component.onShowTabs();
    fixture.detectChanges();
    expect(component.invalidLanguageTags().has('fr')).toBeFalse();
  });

  it('marks invalid language tags when a tab has validation errors', async () => {
    await setup(multiLangConfig);
    component.writeValue([
      defaultStringsValue,
      { ...defaultStringsValue, languageTag: 'fr', title: 'ab' },
    ]);
    component.onShowTabs();
    fixture.detectChanges();
    expect(component.invalidLanguageTags().has('fr')).toBeTrue();
    expect(component.invalidLanguageTags().has('en')).toBeFalse();
  });

});
