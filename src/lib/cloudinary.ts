import { v2 as cloudinary } from 'cloudinary'

// Check if Cloudinary credentials are provided
const hasCloudinaryCredentials = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET
)

if (hasCloudinaryCredentials) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

export { hasCloudinaryCredentials }

export { cloudinary }

export interface UploadResult {
  public_id: string
  secure_url: string
  resource_type: string
  format: string
  bytes: number
  width?: number
  height?: number
}

export async function uploadToCloudinary(
  file: Buffer,
  options: {
    folder?: string
    resource_type?: 'image' | 'video' | 'raw' | 'auto'
    transformation?: object
  } = {}
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      folder: options.folder || 'cms-uploads',
      resource_type: options.resource_type || 'auto',
      transformation: options.transformation,
      use_filename: true,
      unique_filename: true,
      // Ensure public access for all uploads
      type: 'upload',
      access_mode: 'public',
    }

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error)
        } else if (result) {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            resource_type: result.resource_type,
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
          })
        }
      }
    ).end(file)
  })
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!hasCloudinaryCredentials) {
    console.warn('Cloudinary not configured, skipping deletion')
    return
  }

  try {
    // Try deleting as different resource types
    // First try as auto/image
    let result = await cloudinary.uploader.destroy(publicId)
    
    // If not found, try as video
    if (result.result === 'not found') {
      result = await cloudinary.uploader.destroy(publicId, { resource_type: 'video' })
    }
    
    // If still not found, try as raw
    if (result.result === 'not found') {
      result = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' })
    }
    
    // Log the result for debugging
    console.log('Cloudinary deletion result:', result)
    
    if (result.result === 'not found') {
      console.warn(`File with public_id ${publicId} not found in Cloudinary`)
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error)
    throw error
  }
}

/**
 * Generate a proper PDF access URL for Cloudinary
 */
export function getPdfAccessUrl(cloudinaryUrl: string): string {
  // For PDFs stored as raw files, we need to ensure the URL uses the correct format
  // Convert to proper PDF access URL with attachment disposition
  return cloudinaryUrl.replace('/raw/upload/', '/raw/upload/fl_attachment/')
}

/**
 * Generate a PDF thumbnail URL from a Cloudinary raw PDF URL
 */
export function getPdfThumbnailUrl(cloudinaryUrl: string): string {
  try {
    // Extract the cloud name and public_id from the existing URL
    const urlParts = cloudinaryUrl.match(/https:\/\/res\.cloudinary\.com\/([^\/]+)\/(.+)\/upload\/(.+)/)
    if (!urlParts) return cloudinaryUrl
    
    const [, cloudName, resourceType, publicIdWithExtension] = urlParts
    const publicId = publicIdWithExtension.replace(/\.[^.]+$/, '') // Remove file extension
    
    // Generate thumbnail URL for PDF first page
    return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_300,h_300,f_jpg,pg_1/${publicId}.pdf`
  } catch (error) {
    console.error('Error generating PDF thumbnail URL:', error)
    return cloudinaryUrl
  }
}

export const uploadConfig = {
  maxFileSize: 500 * 1024 * 1024, // 500MB for videos
  maxImageSize: 50 * 1024 * 1024, // 50MB for images
  allowedTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'video/mp4',
    'video/mov',
    'video/avi',
    'video/webm',
    'application/pdf',
    'text/plain'
  ],
}