import { body, param } from 'express-validator';

const isRequiredString = (field: string, label: string) =>
  body(field).isString().trim().notEmpty().withMessage(`${label} is required`);

const isOptionalString = (field: string) =>
  body(field).optional({ values: 'null' }).isString().trim();

const isParamId = (field: string) =>
  param(field).isString().trim().notEmpty().withMessage('ID is required');

export const createCompany = [
  isRequiredString('name', 'Company name'),
  isOptionalString('description'),
];

export const updateCompany = [
  isParamId('companyId'),
  isOptionalString('name'),
  isOptionalString('description'),
  isOptionalString('logoUrl'),
  isOptionalString('accentColor'),
];

export const createCampaign = [
  isParamId('companyId'),
  isRequiredString('name', 'Campaign name'),
  isOptionalString('description'),
];

export const createPosting = [
  isParamId('campaignId'),
  isRequiredString('name', 'Posting name'),
  isOptionalString('description'),
];

export const createAsset = [
  isRequiredString('postingFolderId', 'Posting folder ID'),
  isRequiredString('s3FileUrl', 'File URL'),
  isRequiredString('fileType', 'File type'),
];

export const updateAsset = [
  isParamId('id'),
  isOptionalString('captionText'),
  isOptionalString('artworkComment'),
  isOptionalString('revisedCaption'),
  isOptionalString('scheduledDate'),
];

export const updateAssetStatus = [
  isParamId('id'),
  body('status').isString().isIn(['Backlog', 'To Do', 'In Progress', 'In Review', 'Approved', 'Done']).withMessage('Invalid status value'),
];

export const createArticle = [
  isRequiredString('title', 'Article title'),
  isOptionalString('body'),
];

export const updateArticle = [
  isParamId('id'),
  isOptionalString('title'),
  isOptionalString('body'),
  isOptionalString('coverImage'),
  body('status').optional().isIn(['Draft', 'Published']).withMessage('Status must be Draft or Published'),
];

export const createArticleFolder = [
  isParamId('companyId'),
  isRequiredString('name', 'Folder name'),
  isOptionalString('description'),
];

export const createUser = [
  isRequiredString('username', 'Username'),
  isRequiredString('accessCode', 'Access code'),
  isRequiredString('password', 'Onboarding password'),
  body('role').isString().isIn(['Designer', 'Content Writer', 'Team Lead']).withMessage('Invalid role'),
];

export const updateUser = [
  isParamId('id'),
  isOptionalString('username'),
  isOptionalString('accessCode'),
  body('role').optional().isIn(['Designer', 'Content Writer', 'Team Lead']).withMessage('Invalid role'),
];

export const loginCode = [
  isRequiredString('code', 'Access code'),
];
