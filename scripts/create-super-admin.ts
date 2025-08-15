import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createSuperAdmin() {
  try {
    // Check if a super admin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    })

    if (existingSuperAdmin) {
      console.log('Super admin already exists:', existingSuperAdmin.email)
      return
    }

    // Create super admin
    const hashedPassword = await bcrypt.hash('superadmin123', 12)
    
    const superAdmin = await prisma.user.create({
      data: {
        name: 'Super Administrator',
        email: 'superadmin@cms.com',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
      },
    })

    console.log('Super admin created successfully:')
    console.log('Email:', superAdmin.email)
    console.log('Password: superadmin123')
    console.log('Please change the password after first login!')
    
  } catch (error) {
    console.error('Error creating super admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSuperAdmin()
