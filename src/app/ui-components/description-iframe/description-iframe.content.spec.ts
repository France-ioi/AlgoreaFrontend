import {
  DESCRIPTION_EDGE_TO_EDGE_LAYOUT,
  parseDescriptionContent,
} from './description-iframe.content';

describe('parseDescriptionContent', () => {
  it('returns empty body for empty or whitespace-only content', () => {
    expect(parseDescriptionContent('')).toEqual({ bodyHtml: '', edgeToEdge: false });
    expect(parseDescriptionContent('   ')).toEqual({ bodyHtml: '', edgeToEdge: false });
  });

  it('wraps plain text in a paragraph', () => {
    expect(parseDescriptionContent('Plain text only')).toEqual({
      bodyHtml: '<p>Plain text only</p>',
      edgeToEdge: false,
    });
    expect(parseDescriptionContent('a & b < c')).toEqual({
      bodyHtml: '<p>a &amp; b &lt; c</p>',
      edgeToEdge: false,
    });
  });

  it('detects edge-to-edge via data-alg-layout', () => {
    const html = `<div data-alg-layout="${DESCRIPTION_EDGE_TO_EDGE_LAYOUT}"><p>Hi</p></div>`;
    expect(parseDescriptionContent(html)).toEqual({ bodyHtml: html, edgeToEdge: true });
    expect(parseDescriptionContent('<p data-alg-layout="EDGE-TO-EDGE">Hi</p>')).toEqual({
      bodyHtml: '<p data-alg-layout="EDGE-TO-EDGE">Hi</p>',
      edgeToEdge: true,
    });
  });

  it('returns false for other data-alg-layout values', () => {
    const html = '<div data-alg-layout="narrow"><p>Hi</p></div>';
    expect(parseDescriptionContent(html)).toEqual({ bodyHtml: html, edgeToEdge: false });
  });

  it('detects edge-to-edge via data-alg-edge-to-edge', () => {
    const html = '<div data-alg-edge-to-edge><p>Hi</p></div>';
    expect(parseDescriptionContent(html)).toEqual({ bodyHtml: html, edgeToEdge: true });
  });

  it('parses once for both bodyHtml and edgeToEdge', () => {
    const parseSpy = spyOn(DOMParser.prototype, 'parseFromString').and.callThrough();
    const html = `<div data-alg-layout="${DESCRIPTION_EDGE_TO_EDGE_LAYOUT}"><p>Hi</p></div>`;
    parseDescriptionContent(html);
    expect(parseSpy).toHaveBeenCalledTimes(1);
  });
});
