import { AppConfig } from '.';

export function isCommunityConfigured(config: AppConfig): boolean {
  return config.leftMenuTabs.some(tab => tab.type === 'community');
}
