import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { SelectionComponent } from './selection.component';

describe('SelectionComponent', () => {
  let component: SelectionComponent<string>;
  let fixture: ComponentFixture<SelectionComponent<string>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ SelectionComponent ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent<SelectionComponent<string>>(SelectionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', [ { label: 'A', value: 'a' }, { label: 'B', value: 'b' } ]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not reset selectedIndex when items reference changes', () => {
    fixture.componentRef.setInput('items', [ { label: 'A', value: 'a' }, { label: 'B', value: 'b' } ]);
    fixture.detectChanges();

    component.itemChanged(1);
    expect(component['selectedIndex']()).toBe(1);

    fixture.componentRef.setInput('items', [ { label: 'A', value: 'a' }, { label: 'B', value: 'b' } ]);
    fixture.detectChanges();

    expect(component['selectedIndex']()).toBe(1);
  });

  it('should sync selectedIndex when selected input changes', () => {
    fixture.componentRef.setInput('selected', 1);
    fixture.detectChanges();

    expect(component['selectedIndex']()).toBe(1);
  });

  it('should not reset selectedIndex when writeValue runs before effects in form mode', () => {
    fixture.componentRef.setInput('items', [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b' },
      { label: 'C', value: 'c' },
    ]);

    component.registerOnChange(() => {});
    component.writeValue('c');
    expect(component['selectedIndex']()).toBe(2);

    fixture.detectChanges();

    expect(component['selectedIndex']()).toBe(2);
  });

  it('should reflect formControl value after detectChanges and not reset to selected input default', () => {
    @Component({
      template: '<alg-selection [items]="items" [formControl]="control"></alg-selection>',
      imports: [ SelectionComponent, ReactiveFormsModule ],
    })
    class HostComponent {
      items = [
        { label: 'List', value: 'List' },
        { label: 'Grid', value: 'Grid' },
        { label: 'Hide', value: 'Hide' },
      ];
      control = new FormControl('Grid');
    }

    const hostFixture = TestBed.createComponent(HostComponent);
    hostFixture.detectChanges();

    const selection = hostFixture.debugElement.query(By.css('alg-selection'))
      ?.componentInstance as SelectionComponent<string>;
    expect(selection['selectedIndex']()).toBe(1);
  });
});
