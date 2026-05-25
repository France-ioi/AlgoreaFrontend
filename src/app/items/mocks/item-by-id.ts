import { Item } from '../../data-access/get-item-by-id.service';
import { displaySettingsSchema } from '../models/display-settings';
import { ItemViewPerm } from '../models/item-view-permission';
import { ItemGrantViewPerm } from '../models/item-grant-view-permission';
import { ItemEditPerm } from '../models/item-edit-permission';
import { ItemWatchPerm } from '../models/item-watch-permission';

export const mockItem: Item = {
  id: '1',
  requiresExplicitEntry: false,
  string: { title: 'Mock 1', description: null, imageUrl: null, subtitle: null, languageTag: 'en' },
  bestScore: 100,
  permissions: {
    canView: ItemViewPerm.None,
    canGrantView: ItemGrantViewPerm.None,
    canEdit: ItemEditPerm.None,
    canWatch: ItemWatchPerm.None,
    isOwner: false,
    canRequestHelp: false,
  },
  type: 'Task',
  displaySettings: displaySettingsSchema.parse({}),
  textId: null,
  validationType: 'None',
  noScore: false,
  allowsMultipleAttempts: false,
  duration: null,
  enteringTimeMin: new Date(),
  enteringTimeMax: new Date(),
  entryParticipantType: 'User',
  entryFrozenTeams: false,
  entryMaxTeamSize: 0,
  entryMinAdmittedMembersRatio: 'None',
  defaultLanguageTag: 'en',
};
