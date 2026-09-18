import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { allowedNewActivityTypes } from 'src/app/items/models/new-item-types';
import { AddContentComponent } from './add-content.component';

describe('AddContentComponent', () => {
  let fixture: ComponentFixture<AddContentComponent<string>>;
  let component: AddContentComponent<string>;

  function typeButtonByTitle(title: string): DebugElement {
    const button = fixture.debugElement.queryAll(By.css('.content-type-item-container'))
      .find(el => el.query(By.css('.item-title'))?.nativeElement.textContent.trim() === title);
    expect(button).withContext(`type button "${title}"`).toBeTruthy();
    return button!;
  }

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

  it('should show the URL field with optional placeholder when Task is selected', () => {
    fixture.componentRef.setInput('showCreateUI', true);
    fixture.componentRef.setInput('showSearchUI', false);
    fixture.componentRef.setInput('allowedTypesForNewContent', allowedNewActivityTypes);
    component.addContentForm.patchValue({ title: 'New task' });
    fixture.detectChanges();

    const taskButton = typeButtonByTitle('Task');
    expect(taskButton.query(By.css('.item-description'))).toBeNull();

    taskButton.nativeElement.click();
    fixture.detectChanges();

    const urlInput = fixture.debugElement.query(By.css('.input-group input'));
    expect(urlInput).toBeTruthy();
    expect(urlInput.nativeElement.getAttribute('placeholder')).toBe('Task URL (omit to configure it later)');
  });

  it('should emit without url when Task URL is omitted', () => {
    const emitted: unknown[] = [];
    component.contentAdded.subscribe(value => emitted.push(value));

    fixture.componentRef.setInput('showCreateUI', true);
    fixture.componentRef.setInput('showSearchUI', false);
    fixture.componentRef.setInput('allowedTypesForNewContent', allowedNewActivityTypes);
    component.addContentForm.patchValue({ title: 'New task' });
    fixture.detectChanges();

    typeButtonByTitle('Task').nativeElement.click();
    fixture.detectChanges();

    const addButton = fixture.debugElement.query(By.css('.input-group button'));
    addButton.nativeElement.click();

    expect(emitted).toEqual([ { title: 'New task', type: 'Task' } ]);
  });

  it('should emit with url when Task URL is provided', () => {
    const emitted: unknown[] = [];
    component.contentAdded.subscribe(value => emitted.push(value));

    fixture.componentRef.setInput('showCreateUI', true);
    fixture.componentRef.setInput('showSearchUI', false);
    fixture.componentRef.setInput('allowedTypesForNewContent', allowedNewActivityTypes);
    component.addContentForm.patchValue({ title: 'New task' });
    fixture.detectChanges();

    typeButtonByTitle('Task').nativeElement.click();
    fixture.detectChanges();

    component.addContentForm.patchValue({ url: 'https://example.com/task' });
    fixture.detectChanges();

    const addButton = fixture.debugElement.query(By.css('.input-group button'));
    addButton.nativeElement.click();

    expect(emitted).toEqual([ {
      title: 'New task',
      type: 'Task',
      url: 'https://example.com/task',
    } ]);
  });

  it('should show the content type caption by default', () => {
    fixture.componentRef.setInput('showCreateUI', true);
    fixture.componentRef.setInput('showSearchUI', false);
    fixture.componentRef.setInput('allowedTypesForNewContent', allowedNewActivityTypes);
    component.addContentForm.patchValue({ title: 'New content' });
    fixture.detectChanges();

    const caption = fixture.debugElement.query(By.css('.select-caption'));
    expect(caption.nativeElement.textContent.trim()).toBe('Select the type of content to create');
  });

  it('should create Chapter immediately without showing the URL field', () => {
    const emitted: unknown[] = [];
    component.contentAdded.subscribe(value => emitted.push(value));

    fixture.componentRef.setInput('showCreateUI', true);
    fixture.componentRef.setInput('showSearchUI', false);
    fixture.componentRef.setInput('allowedTypesForNewContent', allowedNewActivityTypes);
    component.addContentForm.patchValue({ title: 'New chapter' });
    fixture.detectChanges();

    typeButtonByTitle('Chapter').nativeElement.click();
    fixture.detectChanges();

    expect(emitted).toEqual([ { title: 'New chapter', type: 'Chapter' } ]);
    expect(fixture.debugElement.query(By.css('.input-group'))).toBeNull();
  });

  it('should emit requiresExplicitEntry when creating an explicit-entry chapter', () => {
    const emitted: unknown[] = [];
    component.contentAdded.subscribe(value => emitted.push(value));

    fixture.componentRef.setInput('showCreateUI', true);
    fixture.componentRef.setInput('showSearchUI', false);
    fixture.componentRef.setInput('allowedTypesForNewContent', allowedNewActivityTypes);
    component.addContentForm.patchValue({ title: 'Contest chapter' });
    fixture.detectChanges();

    typeButtonByTitle('Chapter with manual participation').nativeElement.click();
    fixture.detectChanges();

    expect(emitted).toEqual([ {
      title: 'Contest chapter',
      type: 'Chapter',
      requiresExplicitEntry: true,
    } ]);
  });
});
