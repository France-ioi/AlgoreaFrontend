import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

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

  it('should render labeled variant by default', () => {
    fixture.detectChanges();
    const select = fixture.debugElement.query(By.css('alg-select'));
    const trigger = fixture.debugElement.query(By.css('button'));
    expect(select.nativeElement.classList.contains('has-custom-trigger')).toBeFalse();
    expect(trigger.nativeElement.querySelector('.ph-caret-down')).toBeTruthy();
    expect(trigger.nativeElement.querySelector('.ph-globe')).toBeFalsy();
  });

  it('should render compact variant with globe icon and language tag', () => {
    fixture.componentRef.setInput('variant', 'compact');
    fixture.detectChanges();
    const trigger = fixture.debugElement.query(By.css('button'));
    expect(trigger.nativeElement.querySelector('.ph-globe')).toBeTruthy();
    expect(trigger.nativeElement.querySelector('.lang-tag')?.textContent).toBe('EN');
    expect(trigger.nativeElement.querySelector('.ph-caret-down')).toBeFalsy();
    expect(trigger.nativeElement.getAttribute('aria-label')).toContain('Change language');
  });
});
