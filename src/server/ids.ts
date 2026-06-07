import { v4 as uuidv4 } from 'uuid';

export function companyId(): string {
  return `co-${uuidv4().slice(0, 12)}`;
}

export function campaignId(): string {
  return `c-${uuidv4().slice(0, 12)}`;
}

export function postingFolderId(): string {
  return `p-${uuidv4().slice(0, 12)}`;
}

export function assetId(): string {
  return `a-${uuidv4().slice(0, 12)}`;
}

export function articleFolderId(): string {
  return `af-${uuidv4().slice(0, 12)}`;
}

export function articleId(): string {
  return `art-${uuidv4().slice(0, 12)}`;
}

export function userId(): string {
  return `u-${uuidv4().slice(0, 12)}`;
}
