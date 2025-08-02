import { TransformationOptions } from 'cloudinary';

/**
 * Interface for uploaded file metadata
 */
export interface IUploadedFile {
  buffer: Buffer;
  mimetype?: string;
  originalname?: string;
  size?: number;
}

/**
 * Interface for Cloudinary configuration
 */
export interface ICloudinaryConfig {
  cloud_name: string;
  api_key: string;
  api_secret: string;
}

/**
 * Interface for Cloudinary upload options
 */
export interface ICloudinaryUploadOptions {
  resource_type: 'image' | 'auto' | 'video' | 'raw' | undefined;
  folder?: string;
  public_id?: string;
  transformation?: TransformationOptions;
  tags?: string[];
  [key: string]: unknown;
}

/**
 * Interface for Cloudinary deletion response
 */
export interface ICloudinaryDeletionResponse {
  result: string;
  [key: string]: unknown;
}

/**
 * Interface for upload result
 */
export interface ICloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  asset_id?: string;
  format?: string;
  resource_type?: string;
}

/**
 * Service interface for Cloudinary operations
 */
export interface ICloudinaryUploadService {
  uploadImage(
    image: string | IUploadedFile,
    options: Partial<ICloudinaryUploadOptions>
  ): Promise<ICloudinaryUploadResult>;
  deleteImage(publicId: string): Promise<ICloudinaryDeletionResponse>;
}
