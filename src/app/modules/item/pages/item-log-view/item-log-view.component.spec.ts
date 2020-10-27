import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemLogViewComponent } from './item-log-view.component';

describe('ItemLogViewComponent', () => {
  let component: ItemLogViewComponent;
  let fixture: ComponentFixture<ItemLogViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ItemLogViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemLogViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
