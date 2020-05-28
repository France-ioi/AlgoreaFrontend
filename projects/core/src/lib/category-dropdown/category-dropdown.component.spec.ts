import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryDropdownComponent } from './category-dropdown.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('CategoryDropdownComponent', () => {
  let component: CategoryDropdownComponent;
  let fixture: ComponentFixture<CategoryDropdownComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CategoryDropdownComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CategoryDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
