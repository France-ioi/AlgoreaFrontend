import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupIndicatorComponent } from './group-indicator.component';

describe('GroupIndicatorComponent', () => {
  let component: GroupIndicatorComponent;
  let fixture: ComponentFixture<GroupIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ GroupIndicatorComponent ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
