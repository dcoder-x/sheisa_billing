# SHIESA Billing Platform - Setup Guide

## Overview
SHIESA is a comprehensive billing and invoice management platform with dual dashboards for Super Admin (platform governance) and Entity Users (operational billing).

## Prerequisites
- Node.js 18+ and npm/pnpm
- PostgreSQL database
- A text editor or IDE

## Setup Steps

### 1. Environment Variables
Create a `.env.local` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/shiesa_billing"

# Session Secret (use a random string of at least 32 characters)
SESSION_SECRET="your-random-secret-key-min-32-characters-change-this"
```

**Important**: Never commit `.env.local` to version control. It's already in `.gitignore`.

### 2. Install Dependencies
```bash
pnpm install
# or
npm install
```

### 3. Database Setup

#### Option A: Local PostgreSQL
```bash
# Create database
createdb shiesa_billing

# Setup Prisma
npx prisma migrate deploy

# Seed demo data
node scripts/init-db.js
```

#### Option B: Using Vercel PostgreSQL or other hosted solution
1. Update `DATABASE_URL` in `.env.local` with your connection string
2. Run migrations: `npx prisma migrate deploy`
3. Seed data: `node scripts/init-db.js`

### 4. Run Development Server
```bash
pnpm dev
# or
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Demo Credentials

### Super Admin
- **Email**: admin@shiesa.com
- **Password**: demo123
- **Access**: Platform-wide administration, entity management, compliance monitoring

### Entity User
- **Email**: user@techsolutions.com
- **Password**: demo123
- **Access**: Invoice management, supplier handling, reports

## Features

### Super Admin Dashboard
- Platform overview and KPIs
- Entity management and monitoring
- Revenue tracking
- Compliance monitoring
- User management
- Analytics and reporting

### Entity User Dashboard
- Income and expense tracking
- Invoice management
- Supplier management
- Property/asset management
- Sales analytics
- Report generation

## Project Structure

```
├── app/                          # Next.js app directory
│   ├── api/                     # API routes
│   ├── login/                   # Login page
│   ├── admin/                   # Admin dashboard and pages
│   ├── invoices/                # Invoice management
│   ├── suppliers/               # Supplier management
│   ├── reports/                 # Reports page
│   └── settings/                # Settings page
├── components/                  # React components
│   ├── sidebar.tsx             # Navigation sidebar
│   ├── header.tsx              # Header component
│   ├── entity-dashboard.tsx    # Entity user dashboard
│   ├── admin-dashboard.tsx     # Admin dashboard
│   └── ui/                      # shadcn/ui components
├── lib/                         # Utilities and helpers
│   ├── auth.ts                 # Authentication logic
│   └── utils.ts                # General utilities
├── prisma/                      # Database schema
│   └── schema.prisma           # Prisma schema
└── scripts/                     # Utility scripts
    └── init-db.js              # Database initialization
```

## Database Schema

### Core Models
- **User**: System users with roles (SUPER_ADMIN, ENTITY_USER)
- **Entity**: Business entities/organizations
- **Invoice**: Invoices from suppliers
- **Supplier**: Vendor information
- **Transaction**: Income/expense tracking
- **Report**: Generated reports

## Authentication

The application uses JWT-based session management with HTTP-only cookies for security.

### Session Flow
1. User logs in with email/password
2. Credentials verified against database
3. JWT token created and stored in HTTP-only cookie
4. Token validated on subsequent requests via middleware
5. Logout deletes session cookie

## API Routes

```
POST   /api/auth/login         - User login
POST   /api/auth/logout        - User logout
```

## Customization

### Updating Demo Data
Edit `scripts/init-db.js` to modify demo users, entities, invoices, etc.

### Adding New Pages
1. Create new route directory in `app/`
2. Add `page.tsx` with getSession() validation
3. Use Sidebar and Header components for consistent layout

### Styling
- Uses Tailwind CSS and shadcn/ui
- Color scheme: Blue primary (#3b82f6), slate grays, white backgrounds
- Responsive design using Tailwind breakpoints

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists

### "Session not found" on login
- Clear browser cookies
- Check SESSION_SECRET is set
- Verify .env.local exists

### Missing dependencies
```bash
pnpm install
npx prisma generate
```

## Production Deployment

Before deploying:
1. Change SESSION_SECRET to a secure random value
2. Set NODE_ENV=production
3. Use a managed database (Vercel PostgreSQL, AWS RDS, etc.)
4. Enable HTTPS
5. Review and set secure cookie options
6. Implement rate limiting on auth endpoints

## Support

For issues or questions:
1. Check browser console for errors
2. Review application logs in terminal
3. Verify environment variables are set correctly
4. Ensure database is accessible

## License

This project is created with v0.app
