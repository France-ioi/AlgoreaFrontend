import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { By } from '@angular/platform-browser';

import { BreadcrumbsComponent } from './breadcrumbs.component';
import { fromCurrentContent } from 'src/app/store/navigation/current-content/current-content.store';

describe('BreadcrumbsComponent', () => {
  describe('with a last breadcrumb icon', () => {
    let fixture: ComponentFixture<BreadcrumbsComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ BreadcrumbsComponent ],
        providers: [
          provideMockStore({
            selectors: [
              {
                selector: fromCurrentContent.selectBreadcrumbs,
                value: [
                  { title: 'Parent chapter', navigateTo: (): void => {} },
                  { title: 'Current task', icon: 'ph-file-text' },
                ],
              },
              { selector: fromCurrentContent.selectTitle, value: undefined },
            ],
          }),
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(BreadcrumbsComponent);
      fixture.detectChanges();
    });

    it('should render text for intermediate breadcrumbs', () => {
      const labels = fixture.debugElement.queryAll(By.css('.breadcrumb-item .label'));
      expect(labels.length).toBe(1);
      expect(labels[0]!.nativeElement.textContent).toBe('Parent chapter');
    });

    it('should render only the icon for the last breadcrumb when an icon is provided', () => {
      const icon = fixture.debugElement.query(By.css('.breadcrumb-item.active .breadcrumb-icon'));
      const hiddenTitle = fixture.debugElement.query(By.css('.breadcrumb-item.active .visually-hidden'));

      expect(icon).toBeTruthy();
      expect(icon.nativeElement.classList.contains('ph-file-text')).toBeTrue();
      expect(hiddenTitle.nativeElement.textContent).toBe('Current task');
      expect(fixture.debugElement.query(By.css('.breadcrumb-item.active .label'))).toBeNull();
    });
  });

  describe('with an icon on a non-last breadcrumb', () => {
    let fixture: ComponentFixture<BreadcrumbsComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ BreadcrumbsComponent ],
        providers: [
          provideMockStore({
            selectors: [
              {
                selector: fromCurrentContent.selectBreadcrumbs,
                value: [
                  { title: 'Parent with icon', icon: 'ph-folder-simple', navigateTo: (): void => {} },
                  { title: 'Current task', icon: 'ph-file-text' },
                ],
              },
              { selector: fromCurrentContent.selectTitle, value: undefined },
            ],
          }),
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(BreadcrumbsComponent);
      fixture.detectChanges();
    });

    it('should still render text for intermediate breadcrumbs', () => {
      const parentItem = fixture.debugElement.queryAll(By.css('.breadcrumb-item'))[0]!;
      const parentLabel = parentItem.query(By.css('.label'));

      expect(parentLabel.nativeElement.textContent).toBe('Parent with icon');
      expect(parentItem.query(By.css('.breadcrumb-icon'))).toBeNull();
    });
  });
});
