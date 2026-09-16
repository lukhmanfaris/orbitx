import { describe, it, expect } from 'vitest';
import { filenameFromKey, keyFromUrl, safeKey } from '../../src/server/storage';

describe('keyFromUrl', () => {
  it('strips public prefix', () => {
    expect(keyFromUrl('https://pub.r2.dev/uploads/a.jpg', 'https://pub.r2.dev')).toBe('uploads/a.jpg');
  });
  it('tolerates trailing slash on prefix', () => {
    expect(keyFromUrl('https://pub.r2.dev/uploads/a.jpg', 'https://pub.r2.dev/')).toBe('uploads/a.jpg');
  });
  it('returns null for foreign URLs', () => {
    expect(keyFromUrl('https://youtube.com/x', 'https://pub.r2.dev')).toBeNull();
  });
});

describe('filenameFromKey', () => {
  it('returns the last path segment', () => {
    expect(filenameFromKey('uploads/x.png')).toBe('x.png');
  });
  it('sanitizes characters unsafe for Content-Disposition', () => {
    expect(filenameFromKey('uploads/a "b".jpg')).toBe('a__b_.jpg');
  });
});

describe('safeKey', () => {
  it('sanitizes name and prefixes timestamp', () => {
    expect(safeKey('my file (1).PNG', 1700000000000)).toBe('uploads/1700000000000_my_file__1_.PNG');
  });
});
