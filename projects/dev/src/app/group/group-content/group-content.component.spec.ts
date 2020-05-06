import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupContentComponent } from './group-content.component';

describe('GroupContentComponent', () => {
  let component: GroupContentComponent;
  let fixture: ComponentFixture<GroupContentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupContentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
