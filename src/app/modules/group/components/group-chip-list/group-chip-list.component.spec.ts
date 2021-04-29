import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupChipListComponent } from './group-chip-list.component';

describe('GroupChipListComponent', () => {
  let component: GroupChipListComponent;
  let fixture: ComponentFixture<GroupChipListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupChipListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupChipListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
