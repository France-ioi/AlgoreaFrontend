import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListboxComponent } from './listbox.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ListboxComponent', () => {
  let component: ListboxComponent;
  let fixture: ComponentFixture<ListboxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListboxComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
