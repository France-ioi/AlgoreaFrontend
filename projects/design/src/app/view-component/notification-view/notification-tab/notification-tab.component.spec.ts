import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationTabComponent } from './notification-tab.component';

describe('NotificationTabComponent', () => {
  let component: NotificationTabComponent;
  let fixture: ComponentFixture<NotificationTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NotificationTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
