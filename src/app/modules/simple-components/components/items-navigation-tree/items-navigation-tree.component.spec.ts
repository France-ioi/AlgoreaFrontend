import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemsNavigationTreeComponent } from './items-navigation-tree.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('TreeNavigationComponent', () => {
  let component: ItemsNavigationTreeComponent;
  let fixture: ComponentFixture<ItemsNavigationTreeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemsNavigationTreeComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemsNavigationTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
