import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemNavTreeComponent } from './item-nav-tree.component';

describe('ItemNavTreeComponent', () => {
  let component: ItemNavTreeComponent;
  let fixture: ComponentFixture<ItemNavTreeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemNavTreeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemNavTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
