import { AnswerId, AttemptId, ItemId, ItemPath, ParticipantId } from '../ids';
import { ContentRoute } from './content-route';
import { UrlSegment } from '@angular/router';
import { ItemTypeCategory } from 'src/app/items/models/item-type';
import { serializeItemRoute } from './item-route-serializer';

type AnswerType = { id: AnswerId, best: undefined } | { best: { id?: ParticipantId /* not set -> mine */ }, id: undefined };

export interface ItemRouteParameters {
  path?: ItemPath,
  attemptId?: AttemptId,
  parentAttemptId?: AttemptId,
  answer?: AnswerType,
}

export class ItemEntityRoute extends ContentRoute {
  public readonly category: ItemTypeCategory;
  public readonly id: ItemId;
  public readonly page?: string[];
  public readonly answer?: AnswerType;

  constructor(args: { category: ItemTypeCategory, id: ItemId, page?: string[], answer?: AnswerType }) {
    super();
    this.category = args.category;
    this.id = args.id;
    this.page = args.page;
    this.answer = args.answer;
  }

  override urlSegments(currentRoute?: ContentRoute): UrlSegment[] {
    const page = this.page ?? (currentRoute instanceof ItemEntityRoute ? currentRoute.page : undefined);
    return serializeItemRoute(this.category, this.id, this.parameters(), page);
  }

  protected parameters(): ItemRouteParameters {
    return {};
  }

  /**
   * To be used for cloning this
   */
  protected attributes(): ConstructorParameters<typeof ItemEntityRoute>[0] {
    return { category: this.category, id: this.id, answer: this.answer, page: this.page };
  }

}

export class ItemEntityWithPathRoute extends ItemEntityRoute {
  public readonly path: ItemPath;

  constructor(args: ConstructorParameters<typeof ItemEntityRoute>[0] & { path: ItemPath }) {
    super(args);
    this.path = args.path;
  }
  protected override parameters(): ItemRouteParameters {
    return { path: this.path };
  }

  protected override attributes(): ConstructorParameters<typeof ItemEntityWithPathRoute>[0] {
    return { ...super.attributes(), path: this.path };
  }

}

export type ItemEntityWithAttemptRoute = ItemEntityWithSelfAttemptRoute | ItemEntityWithParentAttemptRoute;


export class ItemEntityWithSelfAttemptRoute extends ItemEntityWithPathRoute {
  public readonly attemptId: AttemptId;

  constructor(args: ConstructorParameters<typeof ItemEntityWithPathRoute>[0] & { attemptId: AttemptId }) {
    super(args);
    this.attemptId = args.attemptId;
  }

  protected override parameters(): ItemRouteParameters {
    return { ...super.parameters(), attemptId: this.attemptId };
  }

  protected override attributes(): ConstructorParameters<typeof ItemEntityWithSelfAttemptRoute>[0] {
    return { ...super.attributes(), attemptId: this.attemptId };
  }

}

export class ItemEntityWithParentAttemptRoute extends ItemEntityWithPathRoute {
  public readonly parentAttemptId: AttemptId;

  constructor(args: ConstructorParameters<typeof ItemEntityWithPathRoute>[0] & { parentAttemptId: AttemptId }) {
    super(args);
    this.parentAttemptId = args.parentAttemptId;
  }
  protected override parameters(): ItemRouteParameters {
    return { ...super.parameters(), parentAttemptId: this.parentAttemptId, };
  }

  protected override attributes(): ConstructorParameters<typeof ItemEntityWithParentAttemptRoute>[0] {
    return { ...super.attributes(), parentAttemptId: this.parentAttemptId };
  }

}

export function createItemEntity(
  category: ItemTypeCategory,
  id: ItemId,
  parameters: ItemRouteParameters,
  page?: string[]
): ItemEntityRoute {

}
