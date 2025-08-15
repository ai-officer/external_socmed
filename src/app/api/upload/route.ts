import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToCloudinary, uploadConfig, hasCloudinaryCredentials } from '@/lib/cloudinary'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    service: 'Upload API',
    message: 'Use POST method for file uploads',
    allowedMethods: ['POST', 'HEAD'],
    configured: hasCloudinaryCredentials
  }, { status: hasCloudinaryCredentials ? 200 : 503 })
}

export async function HEAD(request: NextRequest) {
  if (!hasCloudinaryCredentials) {
    return new NextResponse(null, { status: 503 })
  }
  return new NextResponse(null, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Cloudinary is configured
    if (!hasCloudinaryCredentials) {
      return NextResponse.json({ 
        error: 'File upload service not configured. Please contact administrator to set up Cloudinary credentials.' 
      }, { status: 503 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folderId = formData.get('folderId') as string | null
    const description = formData.get('description') as string | null
    const tagIds = formData.get('tagIds') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // File validation - different size limits for different file types
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    const maxSize = isVideo ? uploadConfig.maxFileSize : (isImage ? uploadConfig.maxImageSize : uploadConfig.maxImageSize)
    
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024))
      const fileType = isVideo ? 'video' : isImage ? 'image' : 'file'
      return NextResponse.json(
        { error: `${fileType} size too large. Maximum size is ${maxSizeMB}MB.` },
        { status: 400 }
      )
    }

    if (!uploadConfig.allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not supported' },
        { status: 400 }
      )
    }

    // Verify folder exists if folderId provided (global access - all users can upload to any folder)
    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: { id: folderId }
      })

      if (!folder) {
        return NextResponse.json(
          { error: 'Folder not found' },
          { status: 404 }
        )
      }
      
      console.log('Upload API - Global mode: Uploading to folder:', folder.id, 'owned by:', folder.userId, 'uploader:', session.user.id)
    }

    // Upload to Cloudinary with proper resource type
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Determine resource type based on file type
    let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'
    if (file.type === 'application/pdf') {
      resourceType = 'raw' // PDFs should be uploaded as 'raw' type for direct access
    } else if (file.type.startsWith('video/')) {
      resourceType = 'video'
    } else if (file.type.startsWith('image/')) {
      resourceType = 'image'
    } else {
      resourceType = 'raw' // For documents and other files
    }
    
    const uploadResult = await uploadToCloudinary(buffer, {
      folder: `cms-uploads/${session.user.id}`,
      resource_type: resourceType
    })

    // Parse tag IDs if provided
    let parsedTagIds: string[] = []
    if (tagIds) {
      try {
        parsedTagIds = JSON.parse(tagIds)
      } catch (error) {
        // If it's a comma-separated string, split it
        parsedTagIds = tagIds.split(',').filter(Boolean)
      }
    }

    // Verify tags belong to user if provided
    if (parsedTagIds.length > 0) {
      const userTags = await prisma.tag.findMany({
        where: {
          id: { in: parsedTagIds },
          userId: session.user.id
        }
      })

      if (userTags.length !== parsedTagIds.length) {
        return NextResponse.json(
          { error: 'Some tags not found or access denied' },
          { status: 404 }
        )
      }
    }

    // Save file record to database
    const fileRecord = await prisma.file.create({
      data: {
        filename: uploadResult.public_id.split('/').pop() || file.name,
        originalName: file.name,
        mimeType: file.type,
        size: uploadResult.bytes,
        cloudinaryId: uploadResult.public_id,
        cloudinaryUrl: uploadResult.secure_url,
        description,
        folderId,
        userId: session.user.id,
        tags: parsedTagIds.length > 0 ? {
          create: parsedTagIds.map(tagId => ({
            tagId
          }))
        } : undefined
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      file: {
        ...fileRecord,
        tags: fileRecord.tags.map(ft => ft.tag),
        isImage: fileRecord.mimeType.startsWith('image/'),
        isVideo: fileRecord.mimeType.startsWith('video/'),
        isDocument: fileRecord.mimeType.startsWith('application/') || fileRecord.mimeType.startsWith('text/')
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    )
  }
}