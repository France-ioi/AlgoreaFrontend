import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupRemoveButtonComponent } from './group-remove-button.component';

describe('GroupRemoveButtonComponent', () => {
  let component: GroupRemoveButtonComponent;
  let fixture: ComponentFixture<GroupRemoveButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupRemoveButtonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupRemoveButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
