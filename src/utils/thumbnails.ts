/**
 * Client-side utility functions for generating thumbnail URLs
 * This file is safe to import in client components
 */

/**
 * Generate a Cloudinary thumbnail URL for PDF files
 * This is a client-safe version that doesn't depend on server-side modules
 */
export function getPdfThumbnailUrl(cloudinaryUrl: string): string {
  try {
    // Simple PDF thumbnail generation
    if (cloudinaryUrl.includes('/upload/') && cloudinaryUrl.includes('.pdf')) {
      return cloudinaryUrl.replace('/upload/', '/upload/c_fill,w_300,h_300,f_jpg,pg_1/')
    }
    return cloudinaryUrl
  } catch (error) {
    console.error('Error generating PDF thumbnail URL:', error)
    return cloudinaryUrl
  }
}

/**
 * Generate a Cloudinary thumbnail URL for video files
 * This extracts a frame from the video as a thumbnail
 */
export function getVideoThumbnailUrl(cloudinaryUrl: string): string {
  try {
    // Simple video thumbnail generation
    if (cloudinaryUrl.includes('/upload/')) {
      return cloudinaryUrl.replace('/upload/', '/upload/c_fill,w_300,h_300,f_jpg,so_2/')
    }
    return cloudinaryUrl
  } catch (error) {
    console.error('Error generating video thumbnail URL:', error)
    return cloudinaryUrl
  }
}

/**
 * Generate optimized image thumbnail URL
 */
export function getImageThumbnailUrl(cloudinaryUrl: string, width = 300, height = 300): string {
  try {
    // Simple image thumbnail generation
    if (cloudinaryUrl.includes('/upload/')) {
      return cloudinaryUrl.replace('/upload/', `/upload/c_fill,w_${width},h_${height},f_auto,q_auto/`)
    }
    return cloudinaryUrl
  } catch (error) {
    console.error('Error generating image thumbnail URL:', error)
    return cloudinaryUrl
  }
}

/**
 * Generate a thumbnail URL for document files (DOC, DOCX, TXT, etc.)
 * For documents that can't be converted, returns a data URL placeholder
 */
export function getDocumentThumbnailUrl(cloudinaryUrl: string, mimeType: string): string {
  try {
    // For now, always return placeholder to ensure it works
    // We can optimize for Cloudinary conversion later
    console.log('Generating document thumbnail for:', mimeType)
    return getDocumentPlaceholder(mimeType)
  } catch (error) {
    console.error('Error generating document thumbnail URL:', error)
    return getDocumentPlaceholder(mimeType)
  }
}

/**
 * Generate a placeholder thumbnail for document types
 */
export function getDocumentPlaceholder(mimeType: string): string {
  try {
    const extension = getFileExtensionFromMimeType(mimeType)
    const color = getFileTypeColor(mimeType)
    
    // Create a simple data URL SVG placeholder
    const svg = `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="${color}" rx="8"/><rect x="40" y="60" width="220" height="180" fill="white" rx="4"/><text x="150" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="${color}">${extension.toUpperCase()}</text><rect x="60" y="80" width="180" height="8" fill="#f3f4f6" rx="2"/><rect x="60" y="100" width="160" height="8" fill="#f3f4f6" rx="2"/><rect x="60" y="120" width="140" height="8" fill="#f3f4f6" rx="2"/></svg>`
    
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  } catch (error) {
    console.error('Error generating document placeholder:', error)
    // Return a simple fallback
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#6366f1" rx="8"/><rect x="40" y="60" width="220" height="180" fill="white" rx="4"/><text x="150" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#6366f1">FILE</text></svg>')}`
  }
}

/**
 * Get file extension from mime type
 */
function getFileExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'application/vnd.ms-powerpoint': 'PPT',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'text/plain': 'TXT',
    'text/html': 'HTML',
    'text/css': 'CSS',
    'text/javascript': 'JS',
    'application/json': 'JSON',
    'application/xml': 'XML',
    'text/csv': 'CSV'
  }
  
  return mimeToExt[mimeType] || 'FILE'
}

/**
 * Get color for file type
 */
function getFileTypeColor(mimeType: string): string {
  if (mimeType.includes('pdf')) return '#dc2626'
  if (mimeType.includes('word') || mimeType.includes('document')) return '#2563eb'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '#059669'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '#ea580c'
  if (mimeType.includes('text')) return '#6b7280'
  if (mimeType.includes('json') || mimeType.includes('javascript')) return '#fbbf24'
  return '#6366f1'
}
