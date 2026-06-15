import { deployUrlAssetPath, getDeployUrlPrefix } from './deploy-url';

describe('getDeployUrlPrefix', () => {
  afterEach(() => {
    document.head.innerHTML = '';
  });

  it('returns an empty prefix when only same-origin scripts are present', () => {
    document.head.innerHTML = `
      <script src="assets/config.js"></script>
      <script src="main.js"></script>
    `;
    expect(getDeployUrlPrefix()).toBe('');
  });

  it('returns the directory of the first absolute script src', () => {
    document.head.innerHTML = `
      <script src="assets/config.js"></script>
      <script src="//cdn.example.org/en/main-abc123.js"></script>
    `;
    expect(getDeployUrlPrefix()).toBe('//cdn.example.org/en/');
  });

  it('supports https script src', () => {
    document.head.innerHTML = `
      <script src="https://cdn.example.org/releases/v1/fr/main.js"></script>
    `;
    expect(getDeployUrlPrefix()).toBe('https://cdn.example.org/releases/v1/fr/');
  });
});

describe('deployUrlAssetPath', () => {
  afterEach(() => {
    document.head.innerHTML = '';
  });

  it('prefixes with assets/ locally', () => {
    document.head.innerHTML = '<script src="main.js"></script>';
    expect(deployUrlAssetPath('scripts/device-proxy-platform.js'))
      .toBe('assets/scripts/device-proxy-platform.js');
  });

  it('does not duplicate assets/ when the CDN prefix already ends with it', () => {
    document.head.innerHTML = `
      <script src="https://assets.algorea.org/branch/foo/en/assets/main.js"></script>
    `;
    expect(deployUrlAssetPath('scripts/device-proxy-platform.js'))
      .toBe('https://assets.algorea.org/branch/foo/en/assets/scripts/device-proxy-platform.js');
  });

  it('adds assets/ when the CDN prefix does not already include it', () => {
    document.head.innerHTML = `
      <script src="//cdn.example.org/en/main.js"></script>
    `;
    expect(deployUrlAssetPath('scripts/device-proxy-platform.js'))
      .toBe('//cdn.example.org/en/assets/scripts/device-proxy-platform.js');
  });
});
