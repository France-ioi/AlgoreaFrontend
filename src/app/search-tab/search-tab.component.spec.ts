import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchTabComponent } from './search-tab.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('SearchTabComponent', () => {
  let component: SearchTabComponent;
  let fixture: ComponentFixture<SearchTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SearchTabComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
