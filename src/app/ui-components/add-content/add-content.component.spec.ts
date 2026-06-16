import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { AddContentComponent } from './add-content.component';

describe('AddContentComponent', () => {
  let fixture: ComponentFixture<AddContentComponent<string>>;
  let component: AddContentComponent<string>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ AddContentComponent ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddContentComponent<string>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('searchFunction', () => of([
      { id: 'item-1', title: 'Matching content', type: 'Task' },
    ]));
    fixture.componentRef.setInput('showCreateUI', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render search results after debounced search updates state', async () => {
    component.addContentForm.patchValue({ searchExisting: 'abc' });
    await new Promise<void>(resolve => setTimeout(resolve, 300));
    fixture.detectChanges();

    expect(component.state()?.isReady).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Matching content');
  });

  it('should expose content type choices as keyboard-operable buttons', () => {
    fixture.componentRef.setInput('showCreateUI', true);
    fixture.componentRef.setInput('showSearchUI', false);
    fixture.componentRef.setInput('allowedTypesForNewContent', [
      { type: 'Group', icon: 'ph ph-users', title: 'Group', description: 'A group' },
    ]);
    component.addContentForm.patchValue({ title: 'New group' });
    fixture.detectChanges();

    const typeButton = fixture.debugElement.query(By.css('.content-type-item-container'));
    expect(typeButton.nativeElement.tagName).toBe('BUTTON');
    expect(typeButton.nativeElement.getAttribute('type')).toBe('button');
  });
});
