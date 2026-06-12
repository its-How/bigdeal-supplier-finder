import { canonicalUrl, isSearchPageUrl } from './schema.js';

export { canonicalUrl, isSearchPageUrl };

export function isHttpUrl(value) {
  if (!value || typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function canonicalLeadKey({ url, name = '' }) {
  return `${canonicalUrl(url)}::${String(name).trim().toLowerCase()}`;
}
