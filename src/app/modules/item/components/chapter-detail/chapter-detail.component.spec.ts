import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { AppModule } from 'src/app/core/app.module';
import { mockItemData } from '../../mocks/itemData-mock';
import { ItemDataSource } from '../../services/item-datasource.service';

import { ChapterDetailComponent } from './chapter-detail.component';

describe('ChapterDetailComponent', () => {
  let component: ChapterDetailComponent;
  let fixture: ComponentFixture<ChapterDetailComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        AppModule,
        HttpClientTestingModule,
      ],
      declarations: [ ChapterDetailComponent ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [ { provide: ItemDataSource, useValue: {
        itemData$: of(mockItemData),
        item$: of(mockItemData.item),
      }}]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChapterDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
