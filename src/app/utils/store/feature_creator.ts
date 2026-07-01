import { FeatureConfig, MemoizedSelector, Selector, createActionGroup, createFeatureSelector } from '@ngrx/store';
import { capitalize } from '../case_conversion';
import { RootState } from './root_state';

/**
 * Types from @ngrx/store/src/feature_creator.ts, so that we can create an alternative to createFeature
 */
type Feature<FeatureName extends string, FeatureState> = FeatureConfig<
  FeatureName,
  FeatureState
> &
FeatureSelector<FeatureName, FeatureState>;

type FeatureSelector<FeatureName extends string, FeatureState> = {
  [K in FeatureName as `select${Capitalize<K>}State`]: MemoizedSelector<
    RootState,
    FeatureState,
    (featureState: FeatureState) => FeatureState
  >;
};

export type SelectorsDictionary = Record<
  string,
  | Selector<RootState, unknown>
  // Mirrors @ngrx/store: extra-selector factories take heterogeneous args (e.g. route param names).
  | ((...args: any[]) => Selector<RootState, unknown>)
>;

type ExtraSelectorsFactory<
  FeatureName extends string,
  FeatureState,
  ExtraSelectors extends SelectorsDictionary
> = (featureSelector: FeatureSelector<FeatureName, FeatureState>) => ExtraSelectors;

type ActionGroups = Record<string, ReturnType<typeof createActionGroup>>;

/**
 * Function which behaves as the ngrx `createFeature` function but:
 * - do not create implicit nested selectors (prefer explicit)
 * - append action groups in the feature
 */
export function createFeatureAlt<
  FeatureName extends string,
  FeatureState,
  ExtraSelectors extends SelectorsDictionary,
  CustomActionGroups extends ActionGroups
>(
  featureConfig: FeatureConfig<FeatureName, FeatureState> & {
    extraSelectors?: ExtraSelectorsFactory<FeatureName, FeatureState, ExtraSelectors>,
    actionGroups?: CustomActionGroups,
  }
): Feature<FeatureName, FeatureState> & ExtraSelectors & CustomActionGroups {
  const {
    name,
    reducer,
    extraSelectors: extraSelectorsFactory,
    actionGroups,
  } = featureConfig;

  const featureSelector = {
    [`select${capitalize(name)}State`]: createFeatureSelector<FeatureState>(name),
  } as FeatureSelector<FeatureName, FeatureState>;
  const extraSelectors = extraSelectorsFactory ? extraSelectorsFactory(featureSelector) : {};

  return {
    name,
    reducer,
    ...featureSelector,
    ...extraSelectors,
    ...actionGroups,
  } as Feature<FeatureName, FeatureState> & ExtraSelectors & CustomActionGroups;
}
