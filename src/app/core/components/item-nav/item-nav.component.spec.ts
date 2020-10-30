import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemNavComponent } from './item-nav.component';
import { ItemNavigationService } from '../../http-services/item-navigation.service';
import { EMPTY } from 'rxjs';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';

describe('ItemNavComponent', () => {
  let component: ItemNavComponent;
  let fixture: ComponentFixture<ItemNavComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemNavComponent ],
      providers: [
        { provide: ItemNavigationService, useValue: { getRootActivities: () => EMPTY } },
        { provide: CurrentContentService, useValue: { currentContent$: EMPTY } },
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
