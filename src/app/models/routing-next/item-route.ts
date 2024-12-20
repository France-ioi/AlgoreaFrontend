import { AnswerId, AttemptId, ItemId, ItemPath, ParticipantId } from '../ids';
import { ContentRoute } from './content-route';
import { UrlSegment } from '@angular/router';
import { ItemTypeCategory } from 'src/app/items/models/item-type';
import { serializeItemRoute } from './item-route-serializer';

type SerializerParameters = Parameters<typeof serializeItemRoute>[1];

type AnswerType = { id: AnswerId, best: undefined } | { best: { id?: ParticipantId /* not set -> mine */ }, id: undefined };

export class ItemEntityRoute extends ContentRoute {
  public readonly category: ItemTypeCategory;
  public readonly id: ItemId;
  public readonly page: string[];
  public readonly answer?: AnswerType;

  constructor(args: { category: ItemTypeCategory, id: ItemId, page: string[], answer?: AnswerType }) {
    super();
    this.category = args.category;
    this.id = args.id;
    this.page = args.page;
    this.answer = args.answer;
  }

  override urlSegments(): UrlSegment[] {
    return serializeItemRoute(this, this.parameters());
  }

  protected parameters(): SerializerParameters {
    return {};
  }

  /**
   * To be used for cloning this
   */
  protected attributes(): ConstructorParameters<typeof ItemEntityRoute>[0] {
    return { category: this.category, id: this.id, answer: this.answer, page: this.page };
  }

  clone(override: Partial<ConstructorParameters<typeof ItemEntityRoute>[0]>): ItemEntityRoute {
    return new ItemEntityRoute({ ...this.attributes(), ...override });
  }

  override withPageFrom(route: ContentRoute): ItemEntityRoute {
    if (!(route instanceof ItemEntityRoute)) return this;
    return this.clone({ page: route.page });
  }
}

export class ItemEntityWithPathRoute extends ItemEntityRoute {
  public readonly path: ItemPath;

  constructor(args: ConstructorParameters<typeof ItemEntityRoute>[0] & { path: ItemPath }) {
    super(args);
    this.path = args.path;
  }
  protected override parameters(): SerializerParameters {
    return { path: this.path };
  }

  protected override attributes(): ConstructorParameters<typeof ItemEntityWithPathRoute>[0] {
    return { ...super.attributes(), path: this.path };
  }

  override clone(override: Partial<ConstructorParameters<typeof ItemEntityWithPathRoute>[0]>): ItemEntityWithPathRoute {
    return new ItemEntityWithPathRoute({ ...this.attributes(), ...override });
  }

  override withPageFrom(route: ContentRoute): ItemEntityWithPathRoute {
    if (!(route instanceof ItemEntityRoute)) return this;
    return this.clone({ page: route.page });
  }
}

export type ItemEntityWithAttemptRoute = ItemEntityWithSelfAttemptRoute | ItemEntityWithParentAttemptRoute;


export class ItemEntityWithSelfAttemptRoute extends ItemEntityWithPathRoute {
  public readonly attemptId: AttemptId;

  constructor(args: ConstructorParameters<typeof ItemEntityWithPathRoute>[0] & { attemptId: AttemptId }) {
    super(args);
    this.attemptId = args.attemptId;
  }

  protected override parameters(): SerializerParameters {
    return { ...super.parameters(), attemptId: this.attemptId };
  }

  protected override attributes(): ConstructorParameters<typeof ItemEntityWithSelfAttemptRoute>[0] {
    return { ...super.attributes(), attemptId: this.attemptId };
  }

  override clone(override: Partial<ConstructorParameters<typeof ItemEntityWithSelfAttemptRoute>[0]>): ItemEntityWithSelfAttemptRoute {
    return new ItemEntityWithSelfAttemptRoute({ ...this.attributes(), ...override });
  }

  override withPageFrom(route: ContentRoute): ItemEntityWithSelfAttemptRoute {
    if (!(route instanceof ItemEntityRoute)) return this;
    return this.clone({ page: route.page });
  }

}

export class ItemEntityWithParentAttemptRoute extends ItemEntityWithPathRoute {
  public readonly parentAttemptId: AttemptId;

  constructor(args: ConstructorParameters<typeof ItemEntityWithPathRoute>[0] & { parentAttemptId: AttemptId }) {
    super(args);
    this.parentAttemptId = args.parentAttemptId;
  }
  protected override parameters(): SerializerParameters {
    return { ...super.parameters(), parentAttemptId: this.parentAttemptId, };
  }

  protected override attributes(): ConstructorParameters<typeof ItemEntityWithParentAttemptRoute>[0] {
    return { ...super.attributes(), parentAttemptId: this.parentAttemptId };
  }

  override clone(override: Partial<ConstructorParameters<typeof ItemEntityWithParentAttemptRoute>[0]>): ItemEntityWithParentAttemptRoute {
    return new ItemEntityWithParentAttemptRoute({ ...this.attributes(), ...override });
  }

  override withPageFrom(route: ContentRoute): ItemEntityWithParentAttemptRoute {
    if (!(route instanceof ItemEntityRoute)) return this;
    return this.clone({ page: route.page });
  }

}
