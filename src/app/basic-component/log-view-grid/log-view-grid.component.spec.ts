import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LogViewGridComponent } from './log-view-grid.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('LogViewGridComponent', () => {
  let component: LogViewGridComponent;
  let fixture: ComponentFixture<LogViewGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LogViewGridComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogViewGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
