import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFromCloudinary } from '@/lib/cloudinary'
import { z } from 'zod'

const bulkOperationSchema = z.object({
  operation: z.enum(['delete', 'move', 'copy', 'rename']),
  fileIds: z.array(z.string()).min(1),
  targetFolderId: z.string().optional(),
  renamePattern: z.string().optional(),
  permanent: z.boolean().default(false)
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { operation, fileIds, targetFolderId, renamePattern, permanent } = bulkOperationSchema.parse(body)

    // Verify all files belong to user and are not deleted
    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        userId: session.user.id,
        deletedAt: null
      }
    })

    if (files.length !== fileIds.length) {
      return NextResponse.json(
        { error: 'Some files not found or unauthorized' },
        { status: 403 }
      )
    }

    const results: any[] = []

    switch (operation) {
      case 'delete':
        for (const file of files) {
          try {
            if (permanent) {
              // Delete from Cloudinary
              try {
                await deleteFromCloudinary(file.cloudinaryId)
              } catch (cloudinaryError) {
                console.error('Error deleting from Cloudinary:', cloudinaryError)
                // Continue with database deletion
              }

              // Delete from database
              await prisma.file.delete({ where: { id: file.id } })
            } else {
              // Soft delete
              await prisma.file.update({
                where: { id: file.id },
                data: { deletedAt: new Date() }
              })
            }
            
            results.push({ id: file.id, success: true })
          } catch (error) {
            results.push({ 
              id: file.id, 
              success: false, 
              error: error instanceof Error ? error.message : 'Delete failed'
            })
          }
        }
        break

      case 'move':
        if (targetFolderId !== undefined) {
          // Verify target folder if specified
          if (targetFolderId) {
            const targetFolder = await prisma.folder.findFirst({
              where: {
                id: targetFolderId,
                userId: session.user.id
              }
            })

            if (!targetFolder) {
              return NextResponse.json({ error: 'Target folder not found' }, { status: 404 })
            }
          }

          for (const file of files) {
            try {
              // Check for naming conflicts in target folder
              const existingFile = await prisma.file.findFirst({
                where: {
                  filename: file.filename,
                  folderId: targetFolderId,
                  userId: session.user.id,
                  id: { not: file.id },
                  deletedAt: null
                }
              })

              if (existingFile) {
                results.push({
                  id: file.id,
                  success: false,
                  error: 'File with same name exists in target folder'
                })
                continue
              }

              await prisma.file.update({
                where: { id: file.id },
                data: { folderId: targetFolderId }
              })
              
              results.push({ id: file.id, success: true })
            } catch (error) {
              results.push({ 
                id: file.id, 
                success: false, 
                error: error instanceof Error ? error.message : 'Move failed'
              })
            }
          }
        } else {
          return NextResponse.json({ error: 'Target folder ID required for move operation' }, { status: 400 })
        }
        break

      case 'copy':
        for (const file of files) {
          try {
            // Generate new filename to avoid conflicts
            let newFilename = `Copy of ${file.filename}`
            let counter = 1
            
            while (await prisma.file.findFirst({
              where: {
                filename: newFilename,
                folderId: targetFolderId || file.folderId,
                userId: session.user.id,
                deletedAt: null
              }
            })) {
              counter++
              newFilename = `Copy (${counter}) of ${file.filename}`
            }

            // Create copy in database (Cloudinary URL can be reused for copies)
            const copiedFile = await prisma.file.create({
              data: {
                filename: newFilename,
                originalName: `Copy of ${file.originalName}`,
                mimeType: file.mimeType,
                size: file.size,
                cloudinaryId: file.cloudinaryId, // Same Cloudinary asset
                cloudinaryUrl: file.cloudinaryUrl,
                description: file.description,
                folderId: targetFolderId || file.folderId,
                userId: session.user.id
              }
            })
            
            results.push({ id: file.id, success: true, copyId: copiedFile.id })
          } catch (error) {
            results.push({ 
              id: file.id, 
              success: false, 
              error: error instanceof Error ? error.message : 'Copy failed'
            })
          }
        }
        break

      case 'rename':
        if (!renamePattern) {
          return NextResponse.json({ error: 'Rename pattern required' }, { status: 400 })
        }

        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          try {
            // Replace placeholders in pattern
            let newName = renamePattern
              .replace('{{index}}', (i + 1).toString())
              .replace('{{original}}', file.originalName)
              .replace('{{name}}', file.filename.replace(/\.[^/.]+$/, '')) // Name without extension
            
            // Keep original extension if pattern doesn't include it
            const originalExt = file.filename.substring(file.filename.lastIndexOf('.'))
            if (!newName.includes('.')) {
              newName += originalExt
            }

            // Check for conflicts
            const existingFile = await prisma.file.findFirst({
              where: {
                filename: newName,
                folderId: file.folderId,
                userId: session.user.id,
                id: { not: file.id },
                deletedAt: null
              }
            })

            if (existingFile) {
              results.push({
                id: file.id,
                success: false,
                error: `Name "${newName}" already exists`
              })
              continue
            }

            await prisma.file.update({
              where: { id: file.id },
              data: { filename: newName }
            })
            
            results.push({ id: file.id, success: true, newName })
          } catch (error) {
            results.push({ 
              id: file.id, 
              success: false, 
              error: error instanceof Error ? error.message : 'Rename failed'
            })
          }
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 })
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Error in bulk operations:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Bulk operation failed' },
      { status: 500 }
    )
  }
}