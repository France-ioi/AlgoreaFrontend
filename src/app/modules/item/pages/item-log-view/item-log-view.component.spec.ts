import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CurrentUserService } from 'src/app/shared/services/current-user.service';
import { mockItemData } from '../../mocks/item-data';
import { ItemDataSource } from '../../services/item-datasource.service';

import { ItemLogViewComponent } from './item-log-view.component';

describe('ItemLogViewComponent', () => {
  let component: ItemLogViewComponent;
  let fixture: ComponentFixture<ItemLogViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ItemLogViewComponent ],
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        { provide: CurrentUserService, useValue: {
          currentUser$: of(undefined)
        } },
        { provide: ItemDataSource, useValue: {
          item$: of(mockItemData)
        } }
      ]
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
