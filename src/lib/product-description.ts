export function htmlToPlainDescription(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function stripProductDescription(input: string | null | undefined, maxLength = 180): string {
  const plain = htmlToPlainDescription(input).replace(/\s+/g, ' ').trim();
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

export function isDisallowedSampleSize(size: string | null | undefined): boolean {
  return (size || '').trim().toLowerCase() === '2ml';
}

// Tag allowlist for rich-text product descriptions. The admin Tiptap editor
// only emits these tags, but we sanitize defensively in case a legacy
// description carries something else (or an admin account gets compromised).
const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr',
  'strong', 'b', 'em', 'i', 'u', 's',
  'h2', 'h3',
  'ul', 'ol', 'li',
  'blockquote',
]);

export function sanitizeDescriptionHtml(input: string | null | undefined): string {
  if (!input) return '';
  // Strip script/style blocks entirely (content + tags).
  let html = input
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  // Strip every tag not on the allowlist; strip all attributes from allowed tags.
  html = html.replace(/<\/?([a-zA-Z0-9]+)(\s[^>]*)?>/g, (match, tagName: string, _attrs) => {
    const tag = tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return '';
    const isClosing = match.startsWith('</');
    if (isClosing) return `</${tag}>`;
    const selfClosing = tag === 'br' || tag === 'hr';
    return selfClosing ? `<${tag}>` : `<${tag}>`;
  });
  return html.trim();
}
