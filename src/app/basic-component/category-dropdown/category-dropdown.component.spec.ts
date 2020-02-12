import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryDropdownComponent } from './category-dropdown.component';

describe('CategoryDropdownComponent', () => {
  let component: CategoryDropdownComponent;
  let fixture: ComponentFixture<CategoryDropdownComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CategoryDropdownComponent ]
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
