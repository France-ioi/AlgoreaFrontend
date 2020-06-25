import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupButtonComponent } from './group-button.component';

describe('GroupButtonComponent', () => {
  let component: GroupButtonComponent;
  let fixture: ComponentFixture<GroupButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
