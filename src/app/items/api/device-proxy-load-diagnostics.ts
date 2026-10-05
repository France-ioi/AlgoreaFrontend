import { getDeployUrlPrefix } from 'src/app/utils/deploy-url';
import { sentryReporter } from 'src/app/utils/error-handling/error-reporting';

export type DeviceProxyLoadFailureReason = 'network-error' | 'global-missing';

const MAX_SCRIPT_SRCS = 20;
const MAX_SRC_LENGTH = 300;

export class DeviceProxyLoadError extends Error {
  readonly reason: DeviceProxyLoadFailureReason;

  constructor(reason: DeviceProxyLoadFailureReason) {
    super(reason === 'network-error'
      ? 'Failed to load DeviceProxyPlatform script'
      : 'DeviceProxyPlatform script loaded but global is missing');
    this.name = 'DeviceProxyLoadError';
    this.reason = reason;
  }
}

function isAbsoluteScriptSrc(src: string): boolean {
  return src.startsWith('//') || src.startsWith('http://') || src.startsWith('https://');
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max)}…`;
}

/** Snapshot of script URLs and deploy-prefix provenance, collected only on load failure. */
export function collectDeviceProxyLoadDiagnostics(scriptUrl: string): Record<string, unknown> {
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const prefixSourceIndex = scripts.findIndex(script => isAbsoluteScriptSrc(script.getAttribute('src') ?? ''));

  return {
    scriptUrl,
    deployUrlPrefix: getDeployUrlPrefix(),
    baseURI: document.baseURI,
    scriptSrcs: scripts.slice(0, MAX_SCRIPT_SRCS).map(script =>
      truncate(script.getAttribute('src') ?? '', MAX_SRC_LENGTH)
    ),
    prefixSourceIndex: prefixSourceIndex === -1 ? null : prefixSourceIndex,
  };
}

export function reportDeviceProxyLoadFailure(
  reason: DeviceProxyLoadFailureReason,
  scriptUrl: string,
): void {
  sentryReporter.captureException(new DeviceProxyLoadError(reason), {
    tags: { device_proxy_load: reason },
    contexts: { deviceProxyLoad: collectDeviceProxyLoadDiagnostics(scriptUrl) },
  });
}
