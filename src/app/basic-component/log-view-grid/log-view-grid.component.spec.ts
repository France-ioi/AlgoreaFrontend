import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LogViewGridComponent } from './log-view-grid.component';

describe('LogViewGridComponent', () => {
  let component: LogViewGridComponent;
  let fixture: ComponentFixture<LogViewGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LogViewGridComponent ]
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
