export enum Role {
  Designer = 'Designer',
  ContentWriter = 'Content Writer',
  TeamLead = 'Team Lead'
}

export interface Company {
  id: string;
  name: string;
  logoText?: string;
  accentColor?: string;
  description: string;
  logoUrl?: string;
  logoType?: 'upload' | 'icon' | 'none';
  logoData?: string;
}

export interface User {
  id: string;
  username: string;
  role: Role;
  accessCode: string;
}

export enum AssetStatus {
  Drafting = 'Drafting',
  Refining = 'Refining',
  Ready = 'Ready for Publishing'
}

export interface Campaign {
  id: string;
  companyId: string;
  name: string;
  description: string;
  createdAt: string;
  projectType?: 'both' | 'media' | 'articles'; // legacy — unused in new architecture
}

export interface PostingFolder {
  id: string;
  campaignId: string;
  name: string;
  description: string;
  createdAt: string;
  projectType?: 'both' | 'media' | 'articles'; // legacy — unused in new architecture
}

export interface Asset {
  id: string;
  postingFolderId: string;
  s3FileUrl: string;
  fileType: string;
  captionText: string;
  artworkComment?: string;
  revisedCaption?: string;
  scheduledDate: string;
  status: AssetStatus;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
  updatedAt: string;
  campaignId?: string;
}

export interface ArticleFolder {
  id: string;
  companyId: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Article {
  id: string;
  articleFolderId?: string;
  postingFolderId?: string;
  title: string;
  body: string;
  preparedBy: string;
  createdAt?: string;
  coverImage?: string;
  status?: 'Draft' | 'Published';
}
