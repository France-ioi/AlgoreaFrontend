import { z } from 'zod';

const sentryDsnConfigSchema = z.object({ sentryDsn: z.string().optional() });

export function getSentryDsnConfig(): string | undefined {
  if (!('appConfig' in window)) {
    throw new Error('No environment config found!');
  }
  const config = sentryDsnConfigSchema.parse(window.appConfig);
  return config.sentryDsn;
}
