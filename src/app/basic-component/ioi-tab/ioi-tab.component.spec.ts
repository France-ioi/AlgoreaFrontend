import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IoiTabComponent } from './ioi-tab.component';

describe('IoiTabComponent', () => {
  let component: IoiTabComponent;
  let fixture: ComponentFixture<IoiTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IoiTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IoiTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
