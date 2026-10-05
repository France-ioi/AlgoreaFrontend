import { sentryReporter } from 'src/app/utils/error-handling/error-reporting';
import {
  collectDeviceProxyLoadDiagnostics,
  DeviceProxyLoadError,
  reportDeviceProxyLoadFailure,
} from './device-proxy-load-diagnostics';

describe('collectDeviceProxyLoadDiagnostics', () => {
  afterEach(() => {
    document.head.innerHTML = '';
  });

  it('records script srcs in document order and the first absolute script as the prefix source', () => {
    document.head.innerHTML = `
      <script src="https://lab.thymio.org/injected.js"></script>
      <script src="//static5.algorea.org/frontend/releases/v2.93.1/fr/main-abc.js"></script>
    `;

    const diagnostics = collectDeviceProxyLoadDiagnostics(
      'https://lab.thymio.org/assets/scripts/device-proxy-platform.js',
    );

    expect(diagnostics['scriptUrl']).toBe('https://lab.thymio.org/assets/scripts/device-proxy-platform.js');
    expect(diagnostics['deployUrlPrefix']).toBe('https://lab.thymio.org/');
    expect(diagnostics['baseURI']).toBe(document.baseURI);
    expect(diagnostics['prefixSourceIndex']).toBe(0);
    expect(diagnostics['scriptSrcs']).toEqual(jasmine.arrayContaining([
      'https://lab.thymio.org/injected.js',
      '//static5.algorea.org/frontend/releases/v2.93.1/fr/main-abc.js',
    ]));
    expect((diagnostics['scriptSrcs'] as string[])[0]).toBe('https://lab.thymio.org/injected.js');
    expect((diagnostics['scriptSrcs'] as string[])[1]).toBe(
      '//static5.algorea.org/frontend/releases/v2.93.1/fr/main-abc.js',
    );
  });

  it('caps scriptSrcs at 20 entries and truncates each src to 300 characters', () => {
    const longSrc = `https://cdn.example.org/${'a'.repeat(400)}.js`;
    const extra = Array.from({ length: 21 }, (_, i) =>
      `<script src="https://cdn.example.org/extra-${i}.js"></script>`
    ).join('');
    document.head.innerHTML = `<script src="${longSrc}"></script>${extra}`;

    const diagnostics = collectDeviceProxyLoadDiagnostics('https://example.test/device-proxy-platform.js');
    const scriptSrcs = diagnostics['scriptSrcs'] as string[];

    expect(scriptSrcs.length).toBe(20);
    const firstSrc = scriptSrcs[0] ?? '';
    expect(firstSrc.length).toBe(301);
    expect(firstSrc.endsWith('…')).toBeTrue();
    expect(firstSrc.startsWith('https://cdn.example.org/')).toBeTrue();
  });
});

describe('reportDeviceProxyLoadFailure', () => {
  afterEach(() => {
    document.head.innerHTML = '';
  });

  it('captures a DeviceProxyLoadError with the load tag and diagnostics context', () => {
    const captureException = spyOn(sentryReporter, 'captureException').and.returnValue('event-id');
    document.head.innerHTML = '<script src="https://lab.thymio.org/injected.js"></script>';

    reportDeviceProxyLoadFailure('global-missing', 'https://lab.thymio.org/assets/scripts/device-proxy-platform.js');

    expect(captureException).toHaveBeenCalledTimes(1);
    const [error, context] = captureException.calls.mostRecent().args;
    expect(error).toEqual(jasmine.any(DeviceProxyLoadError));
    expect((error as DeviceProxyLoadError).reason).toBe('global-missing');
    expect((error as DeviceProxyLoadError).message).toBe(
      'DeviceProxyPlatform script loaded but global is missing',
    );
    expect(context).toEqual(jasmine.objectContaining({
      tags: { device_proxy_load: 'global-missing' },
      contexts: jasmine.objectContaining({
        deviceProxyLoad: jasmine.objectContaining({
          scriptUrl: 'https://lab.thymio.org/assets/scripts/device-proxy-platform.js',
          deployUrlPrefix: 'https://lab.thymio.org/',
          prefixSourceIndex: 0,
        }),
      }),
    }));
  });
});
