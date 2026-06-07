import { SupabaseClient } from '@supabase/supabase-js';
import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';

export interface RouteDeps {
  supabase: SupabaseClient;
  r2: S3Client;
  upload: multer.Multer;
  uploadsDir: string;
}
