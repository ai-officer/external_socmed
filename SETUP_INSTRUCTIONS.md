# Phase 1 Setup Instructions

## Database Setup Required

To complete the Phase 1 testing, you need to set up PostgreSQL database:

### 1. Install PostgreSQL (if not already installed)

**macOS (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### 2. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE cms_db;
CREATE USER cms_user WITH ENCRYPTED PASSWORD 'cms_password';
GRANT ALL PRIVILEGES ON DATABASE cms_db TO cms_user;
\q
```

### 3. Setup Environment Variables

Copy the example environment file and update with your credentials:
```bash
cp env.example .env.local
```

Update `.env.local` with your database credentials:
```env
DATABASE_URL="postgresql://cms_user:cms_password@localhost:5432/cms_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### 4. Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed the database with test data
npx prisma db seed
```

### 5. Setup Cloudinary for File Uploads (Required for upload functionality)

For file upload functionality, you need to configure Cloudinary:

1. Create a free account at https://cloudinary.com
2. Get your credentials from the dashboard
3. Update `.env.local` with your Cloudinary credentials:

```env
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"  
CLOUDINARY_API_SECRET="your-api-secret"
```

**Note:** File upload will not work without these credentials. The app will display helpful setup instructions when uploads are attempted without proper configuration.

### 6. Test the Application

```bash
# Start development server
npm run dev

# In another terminal, run the test
node test-phase1.js
```

### 7. Access the Application

- Open http://localhost:3001
- Use demo accounts:
  - Admin: `admin@cms.com` / `admin123`
  - User: `user@cms.com` / `user123`

## Phase 1 Features Implemented

✅ **PRD 01 - Project Setup**
- Next.js 14 with TypeScript
- Tailwind CSS configuration  
- ESLint and project structure
- Environment configuration

✅ **PRD 02 - Database Setup**
- Prisma ORM integration
- PostgreSQL schema with relationships
- Database seeding with test data
- User, Folder, File, Tag models

✅ **PRD 03 - Authentication System**
- NextAuth.js with credentials provider
- Login/Register pages
- Session management
- Password hashing with bcrypt

✅ **PRD 04 - Cloudinary Integration**
- File upload API endpoint
- Cloud storage configuration
- File validation and processing
- Integration with database models

## Current Functionality

1. **User Authentication**: Login/Register with session management
2. **File Upload**: Basic drag-and-drop file upload to Cloudinary
3. **Database Models**: Complete schema with relationships
4. **API Endpoints**: Authentication and file upload endpoints
5. **Security**: Password hashing, file validation, user session

## Ready for Phase 2!

The foundation is complete and ready for Phase 2 implementation:
- File management with folders
- File listing and viewing
- Advanced search and filtering
- Admin dashboard features