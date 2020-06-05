import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupCompositionComponent } from './group-composition.component';

describe('GroupCompositionComponent', () => {
  let component: GroupCompositionComponent;
  let fixture: ComponentFixture<GroupCompositionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupCompositionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupCompositionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
