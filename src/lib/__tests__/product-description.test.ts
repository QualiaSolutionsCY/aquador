import {
  htmlToPlainDescription,
  sanitizeDescriptionHtml,
  stripProductDescription,
} from '../product-description';

describe('product description formatting', () => {
  it('preserves allowed rich text tags from the admin editor', () => {
    expect(
      sanitizeDescriptionHtml('<h2>Opening</h2><p><strong>Bright</strong><br>Fresh</p><ul><li>Citrus</li></ul>'),
    ).toBe('<h2>Opening</h2><p><strong>Bright</strong><br>Fresh</p><ul><li>Citrus</li></ul>');
  });

  it('converts legacy plain text line breaks into renderable HTML', () => {
    expect(sanitizeDescriptionHtml('First line\nSecond line\n\nNext paragraph')).toBe(
      '<p>First line<br>Second line</p><p>Next paragraph</p>',
    );
  });

  it('strips unsafe tags and attributes while keeping formatting', () => {
    expect(
      sanitizeDescriptionHtml('<p onclick="bad()">Safe <strong>bold</strong></p><script>alert(1)</script><img src=x>'),
    ).toBe('<p>Safe <strong>bold</strong></p>');
  });

  it('still produces plain SEO text from rich descriptions', () => {
    expect(htmlToPlainDescription('<p><strong>Fresh</strong><br>Citrus</p>')).toBe('Fresh\nCitrus');
    expect(stripProductDescription('<p><strong>Fresh</strong><br>Citrus</p>')).toBe('Fresh Citrus');
  });
});
