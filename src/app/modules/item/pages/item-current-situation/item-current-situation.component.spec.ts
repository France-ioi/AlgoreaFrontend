import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemCurrentSituationComponent } from './item-current-situation.component';

describe('ItemCurrentSituationComponent', () => {
  let component: ItemCurrentSituationComponent;
  let fixture: ComponentFixture<ItemCurrentSituationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ItemCurrentSituationComponent ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemCurrentSituationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
