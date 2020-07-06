import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupNavComponent } from './group-nav.component';

describe('GroupNavComponent', () => {
  let component: GroupNavComponent;
  let fixture: ComponentFixture<GroupNavComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupNavComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
