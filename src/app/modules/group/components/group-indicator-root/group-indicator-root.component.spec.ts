import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupIndicatorRootComponent } from './group-indicator-root.component';

describe('GroupIndicatorRootComponent', () => {
  let component: GroupIndicatorRootComponent;
  let fixture: ComponentFixture<GroupIndicatorRootComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupIndicatorRootComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupIndicatorRootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
