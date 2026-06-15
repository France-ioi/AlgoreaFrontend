export interface DeviceProxyPlatformApi {
  deviceProxy(
    category: string,
    method: string,
    args: unknown[],
    callback: (result: unknown) => void,
    errorCallback: (error: unknown) => void,
  ): void,
  cleanup(): void,
}

declare global {
  interface Window {
    // UMD global from scripts/device-proxy-platform.js (lazy-loaded)
    // eslint-disable-next-line @typescript-eslint/naming-convention
    DeviceProxyPlatform?: DeviceProxyPlatformApi,
    task?: {
      deviceProxy(
        category: string,
        method: string,
        args: unknown,
        success: (result: unknown) => void,
        error: (error: unknown) => void,
      ): void,
    },
  }
}

const DEVICE_PROXY_SCRIPT_PATH = 'scripts/device-proxy-platform.js';

let loadPromise: Promise<void> | null = null;

/** Lazy-load the UMD bundle on first device-proxy use (not bundled in the main app scripts). */
export function ensureDeviceProxyPlatformLoaded(): Promise<void> {
  if (window.DeviceProxyPlatform) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = DEVICE_PROXY_SCRIPT_PATH;
    script.async = true;
    script.onload = (): void => {
      if (window.DeviceProxyPlatform) resolve();
      else reject(new Error('DeviceProxyPlatform script loaded but global is missing'));
    };
    script.onerror = (): void => reject(new Error('Failed to load DeviceProxyPlatform script'));
    document.head.appendChild(script);
  });
  return loadPromise;
}

function getDeviceProxyPlatform(): DeviceProxyPlatformApi {
  const platform = window.DeviceProxyPlatform;
  if (!platform) throw new Error('DeviceProxyPlatform script not loaded');
  return platform;
}

export function handleDeviceProxy(
  category: string,
  method: string,
  args: unknown[],
  callback: (result: unknown) => void,
  errorCallback: (error: unknown) => void,
): void {
  getDeviceProxyPlatform().deviceProxy(category, method, args, callback, errorCallback);
}

export function cleanupDeviceProxy(): void {
  if (!window.DeviceProxyPlatform) return;
  window.DeviceProxyPlatform.cleanup();
}

/** No-op bridge kept after teardown so async device events from cleanup() cannot throw. */
export function swallowDeviceProxyEvents(): void {
  window.task = { deviceProxy: (): void => {} };
}
