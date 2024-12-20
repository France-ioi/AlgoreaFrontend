import { DefaultUrlSerializer, PRIMARY_OUTLET } from '@angular/router';
import { ContentRoute } from './content-route';
import { NotFoundRoute } from './not-found-route';
import { deserializeItemRoute } from './item-route-serializer';

export function deserializeContentRoute(url: string): ContentRoute {
  const urlTree = new DefaultUrlSerializer().parse(url);
  const segments = urlTree.root.children[PRIMARY_OUTLET]?.segments;
  if (!segments) throw new Error('route deserialization: no segments in primary outlet');
  for (const deserializer of [ deserializeItemRoute ]) {
    const result = deserializer(segments);
    if (result) return result;
  }
  return new NotFoundRoute(segments);
}
