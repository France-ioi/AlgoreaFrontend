import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguagePickerComponent } from './language-picker.component';
import { LocaleService } from '../../services/localeService';

describe('LanguagePickerComponent', () => {
  let component: LanguagePickerComponent;
  let fixture: ComponentFixture<LanguagePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ LanguagePickerComponent ],
      providers: [
        {
          provide: LocaleService,
          useValue: {
            languages: [ { tag: 'en' }, { tag: 'fr' } ],
            currentLang: { tag: 'en' },
            navigateTo: jasmine.createSpy('navigateTo'),
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LanguagePickerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize current from localeService when defaultLang is omitted', () => {
    expect(component.current()).toBe('en');
  });

  it('should reset current when defaultLang input changes', () => {
    fixture.componentRef.setInput('defaultLang', 'fr');
    expect(component.current()).toBe('fr');

    component.current.set('en');
    expect(component.current()).toBe('en');

    fixture.componentRef.setInput('defaultLang', 'es');
    expect(component.current()).toBe('es');
  });
});
