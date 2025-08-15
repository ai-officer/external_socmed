import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@cms.com' },
    update: {},
    create: {
      email: 'admin@cms.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  // Create test user
  const testUserPassword = await bcrypt.hash('user123', 12)
  
  const testUser = await prisma.user.upsert({
    where: { email: 'user@cms.com' },
    update: {},
    create: {
      email: 'user@cms.com',
      name: 'Test User',
      password: testUserPassword,
      role: 'USER',
    },
  })

  // Create sample folder structure for test user
  const documentsFolder = await prisma.folder.create({
    data: {
      name: 'Documents',
      description: 'Document storage folder',
      userId: testUser.id,
    },
  })

  const imagesFolder = await prisma.folder.create({
    data: {
      name: 'Images',
      description: 'Image storage folder',
      userId: testUser.id,
    },
  })

  // Create sample tags
  await prisma.tag.createMany({
    data: [
      {
        name: 'important',
        color: '#EF4444',
        userId: testUser.id,
      },
      {
        name: 'work',
        color: '#3B82F6',
        userId: testUser.id,
      },
      {
        name: 'personal',
        color: '#10B981',
        userId: testUser.id,
      },
    ],
  })

  console.log('Database seeded successfully!')
  console.log('Admin user: admin@cms.com / admin123')
  console.log('Test user: user@cms.com / user123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })