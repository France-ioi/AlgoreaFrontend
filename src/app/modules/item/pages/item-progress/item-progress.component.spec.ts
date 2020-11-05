import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemProgressComponent } from './item-progress.component';

describe('ItemProgressComponent', () => {
  let component: ItemProgressComponent;
  let fixture: ComponentFixture<ItemProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ItemProgressComponent ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
