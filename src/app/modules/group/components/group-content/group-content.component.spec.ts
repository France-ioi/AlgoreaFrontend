import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupContentComponent } from './group-content.component';
import { AppModule } from '../../../../core/app.module';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Group } from '../../../../shared/models/group.model';

describe('GroupContentComponent', () => {
  let component: GroupContentComponent;
  let fixture: ComponentFixture<GroupContentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        AppModule,
        HttpClientTestingModule,
        NoopAnimationsModule,
        RouterTestingModule
      ],
      declarations: [GroupContentComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            url: of({id: 50}),
          }
        },
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupContentComponent);
    component = fixture.componentInstance;
    component.group = new Group();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
