import { Pipe, PipeTransform } from '@angular/core';
import { ItemPermPropagations } from './item-perm-propagation';

export type ContentViewPropagation = ItemPermPropagations['contentViewPropagation'];

export function contentViewPropagationDisplay(
  value: ContentViewPropagation,
  requiresExplicitEntry: boolean,
): { label: string, icon: string } {
  if (requiresExplicitEntry) {
    switch (value) {
      case 'none':
        return { label: $localize`Hidden`, icon: 'ph-duotone ph-eye-slash' };
      case 'as_info':
        return { label: $localize`View entry page`, icon: 'ph-duotone ph-door' };
      case 'as_content':
        return { label: $localize`Free entry`, icon: 'ph-duotone ph-door-open' };
    }
  }

  switch (value) {
    case 'none':
      return { label: $localize`Locked and hidden`, icon: 'ph-duotone ph-eye-slash' };
    case 'as_info':
      return { label: $localize`Locked`, icon: 'ph-duotone ph-lock-simple' };
    case 'as_content':
      return { label: $localize`Open`, icon: 'ph-duotone ph-eye' };
  }
}

@Pipe({
  name: 'contentViewPropagationIcon',
  pure: true,
})
export class ContentViewPropagationIconPipe implements PipeTransform {
  transform(value: ContentViewPropagation | undefined, requiresExplicitEntry: boolean): string {
    if (value === undefined) return '';
    return contentViewPropagationDisplay(value, requiresExplicitEntry).icon;
  }
}

@Pipe({
  name: 'contentViewPropagationLabel',
  pure: true,
})
export class ContentViewPropagationLabelPipe implements PipeTransform {
  transform(value: ContentViewPropagation | undefined, requiresExplicitEntry: boolean): string {
    if (value === undefined) return '';
    return contentViewPropagationDisplay(value, requiresExplicitEntry).label;
  }
}
