import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { APPCONFIG } from '../config';
import { GetItemChildrenService, ItemChildren } from './get-item-children.service';

describe('GetItemChildrenService', () => {
  let service: GetItemChildrenService;
  let httpTestingController: HttpTestingController;
  const apiUrl = 'http://mock.api';

  const visibleChildBody = {
    id: '1',
    type: 'Task',
    order: 0,
    category: 'Undefined',
    score_weight: 1,
    content_view_propagation: 'as_info',
    upper_view_levels_propagation: 'as_is',
    grant_view_propagation: false,
    watch_propagation: false,
    edit_propagation: false,
    permissions: {
      can_view: 'content',
      can_grant_view: 'none',
      can_watch: 'none',
      can_edit: 'none',
      is_owner: false,
    },
    string: { language_tag: 'en', title: 'Task A', subtitle: null, image_url: null },
    best_score: 0,
    results: [],
    no_score: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: APPCONFIG, useValue: { apiUrl } },
      ],
    });
    service = TestBed.inject(GetItemChildrenService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should omit show_level2_children when the option is off', () => {
    service.get('42', '0').subscribe();

    const req = httpTestingController.expectOne(
      r => r.url === `${apiUrl}/items/42/children` && r.method === 'GET',
    );
    expect(req.request.params.get('attempt_id')).toBe('0');
    expect(req.request.params.has('show_level2_children')).toBe(false);
    req.flush([]);
  });

  it('should send show_level2_children=1 when enabled', () => {
    service.get('42', '0', { showLevel2Children: true }).subscribe();

    const req = httpTestingController.expectOne(
      r => r.url === `${apiUrl}/items/42/children` && r.method === 'GET',
    );
    expect(req.request.params.get('show_level2_children')).toBe('1');
    req.flush([]);
  });

  it('should decode optional nested children on top-level items only', () => {
    let result: ItemChildren | undefined;
    service.get('42', '0', { showLevel2Children: true }).subscribe(children => {
      result = children;
    });

    const req = httpTestingController.expectOne(
      r => r.url === `${apiUrl}/items/42/children`,
    );
    req.flush([
      {
        ...visibleChildBody,
        children: [
          {
            ...visibleChildBody,
            id: '2',
            string: { language_tag: 'en', title: 'Nested', subtitle: null, image_url: null },
          },
        ],
      },
      {
        ...visibleChildBody,
        id: '3',
        string: { language_tag: 'en', title: 'No nest', subtitle: null, image_url: null },
      },
      {
        ...visibleChildBody,
        id: '4',
        string: { language_tag: 'en', title: 'Empty nest', subtitle: null, image_url: null },
        children: [],
      },
    ]);

    expect(result).toBeDefined();
    const children = result as ItemChildren;
    expect(children[0]?.children).toHaveSize(1);
    expect(children[0]?.children?.[0]?.id).toBe('2');
    expect(children[0]?.children?.[0]?.string.title).toBe('Nested');
    expect(children[1]?.children).toBeUndefined();
    expect(children[2]?.children).toEqual([]);
  });
});
