import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';

import { PlatformLogoComponent } from './platform-logo.component';
import { APPCONFIG } from 'src/app/config';

describe('PlatformLogoComponent', () => {
  async function createFixture(config: { leftHeaderLogoUrl?: string, title?: string }): Promise<ComponentFixture<PlatformLogoComponent>> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ PlatformLogoComponent ],
      providers: [
        provideRouter([]),
        { provide: APPCONFIG, useValue: { leftHeaderLogoUrl: config.leftHeaderLogoUrl } },
        { provide: Title, useValue: { getTitle: (): string => config.title ?? 'Algorea' } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PlatformLogoComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders a logo image when leftHeaderLogoUrl is configured', async () => {
    const fixture = await createFixture({
      leftHeaderLogoUrl: 'https://example.test/logo.png',
      title: 'My Platform',
    });
    const link = fixture.debugElement.query(By.css('a.link'));
    expect(link).toBeTruthy();
    expect(link.nativeElement.classList.contains('platform-name')).toBeFalse();

    const img = fixture.debugElement.query(By.css('img.logo'));
    expect(img).toBeTruthy();
    expect(img.nativeElement.src).toContain('https://example.test/logo.png');
    expect(img.nativeElement.alt).toBe('My Platform');
  });

  it('renders the page title when leftHeaderLogoUrl is not configured', async () => {
    const fixture = await createFixture({ title: 'Algorea' });
    const link = fixture.debugElement.query(By.css('a.link'));
    expect(link.nativeElement.textContent.trim()).toBe('Algorea');
    expect(link.nativeElement.classList.contains('platform-name')).toBeTrue();
    expect(fixture.debugElement.query(By.css('img.logo'))).toBeNull();
  });

  it('links to the home route', async () => {
    const fixture = await createFixture({});
    const link = fixture.debugElement.query(By.css('a.link'));
    expect(link.attributes['href']).toBe('/');
  });
});
