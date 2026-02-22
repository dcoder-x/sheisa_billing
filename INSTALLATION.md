# SHIESA Billing Platform - Installation Guide

## Prerequisites

Before starting, ensure you have:
- **Node.js 18+** - Download from nodejs.org
- **pnpm** - Install with `npm install -g pnpm`
- **PostgreSQL 12+** - Download from postgresql.org
- **Code Editor** - VS Code, Cursor, or similar

## Step-by-Step Installation

### Step 1: Verify PostgreSQL is Running

**Windows/Mac:**
```bash
# Test PostgreSQL connection
psql -U postgres -c "SELECT version();"
```

**If PostgreSQL isn't running:**
- **Mac**: Use Homebrew: `brew services start postgresql`
- **Windows**: Start PostgreSQL from Services
- **Linux**: `sudo systemctl start postgresql`

### Step 2: Create Database

Open terminal and run:
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE shiesa_billing;

# Exit psql
\q
```

Or use a single command:
```bash
createdb -U postgres shiesa_billing
```

### Step 3: Create Environment File

In the project root, create a file named `.env.local`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/shiesa_billing"
SESSION_SECRET="my-super-secret-key-that-is-at-least-32-characters-long-12345"
```

**Replace:**
- `password` - Your PostgreSQL password
- `SESSION_SECRET` - Use any random string (minimum 32 characters)

### Step 4: Install Dependencies

```bash
cd /path/to/project
pnpm install
```

This installs all required packages including:
- Next.js 16
- Prisma ORM
- React 19
- Tailwind CSS
- Recharts
- And more...

### Step 5: Initialize Database

Run database migrations:
```bash
npx prisma migrate deploy
```

This creates all tables in your database.

### Step 6: Seed Demo Data

Populate database with demo data:
```bash
node scripts/init-db.js
```

You should see:
```
Starting database initialization...
Created entity: [uuid]
Created admin user: admin@shiesa.com
Created entity user: user@techsolutions.com
Created suppliers
Created demo invoices
Created demo transactions
Database initialization completed!
```

### Step 7: Start Development Server

```bash
pnpm dev
```

You should see:
```
  ▲ Next.js 16.1.6
  - Local:        http://localhost:3000
  - Environments: .env.local
```

### Step 8: Access Application

1. Open browser and go to: `http://localhost:3000`
2. You'll be redirected to login page
3. Login with demo credentials:

**Option A: Super Admin**
- Email: `admin@shiesa.com`
- Password: `demo123`
- Access: Admin Dashboard, Entity Management, Compliance

**Option B: Entity User**
- Email: `user@techsolutions.com`
- Password: `demo123`
- Access: Entity Dashboard, Invoices, Suppliers, Reports

## Troubleshooting

### Issue: "Error: Could not connect to the database server"

**Solution:**
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# If fails, start PostgreSQL:
# Mac: brew services start postgresql
# Windows: Start PostgreSQL from Services
# Linux: sudo systemctl start postgresql
```

### Issue: "database "shiesa_billing" does not exist"

**Solution:**
```bash
createdb -U postgres shiesa_billing
```

### Issue: "password authentication failed"

**Solution:**
1. Update `DATABASE_URL` in `.env.local` with correct PostgreSQL password
2. Test connection: `psql -U postgres -d shiesa_billing`

### Issue: "Prisma Client was already instantiated"

**Solution:**
- Restart dev server: Press `Ctrl+C` and run `pnpm dev` again

### Issue: "Relation does not exist"

**Solution:**
```bash
# Rerun migrations
npx prisma migrate deploy

# Or reset everything (WARNING: deletes all data)
npx prisma migrate reset
```

### Issue: "No demo data visible after login"

**Solution:**
```bash
node scripts/init-db.js
```

### Issue: "PORT 3000 is already in use"

**Solution:**
```bash
# Use different port
pnpm dev -- --port 3001
```

## Verification Checklist

After installation, verify everything works:

- [ ] PostgreSQL is running (`psql -U postgres -c "SELECT 1"`)
- [ ] Database exists (`psql -U postgres -d shiesa_billing`)
- [ ] `.env.local` file created with DATABASE_URL and SESSION_SECRET
- [ ] Dependencies installed (`pnpm install` completed)
- [ ] Database migrations applied (`npx prisma migrate deploy`)
- [ ] Demo data seeded (`node scripts/init-db.js`)
- [ ] Dev server running (`pnpm dev` with no errors)
- [ ] Can access `http://localhost:3000/login`
- [ ] Can login with demo credentials
- [ ] Dashboard loads with data

## Next Steps

1. **Explore the Application**
   - Login as Super Admin to see `/admin`
   - Login as Entity User to see `/`
   - Check all navigation pages

2. **Understand the Code**
   - Read `PROJECT_SUMMARY.md` for architecture
   - Check `components/` for UI components
   - Review `app/` for page structure
   - Study `prisma/schema.prisma` for data models

3. **Customize**
   - Modify demo data in `scripts/init-db.js`
   - Update colors in component files
   - Add new pages following existing patterns
   - Modify tables and forms as needed

4. **Deploy**
   - See `SETUP.md` for deployment instructions
   - Use Vercel for easy Next.js deployment
   - Connect PostgreSQL database
   - Set environment variables in Vercel dashboard

## Database Management

### View Database in GUI

```bash
npx prisma studio
```

Opens interactive database editor at `http://localhost:5555`

### Create Backup

```bash
# PostgreSQL dump
pg_dump -U postgres shiesa_billing > backup.sql

# Restore
psql -U postgres shiesa_billing < backup.sql
```

### Reset Database

```bash
# WARNING: DELETES ALL DATA
npx prisma migrate reset

# Then reseed:
node scripts/init-db.js
```

## Development Tips

**Hot Reload**: All changes automatically reload in browser - no restart needed!

**Database Debugging**:
```bash
# View all data
npx prisma studio

# Check schema
npx prisma db pull

# Format schema
npx prisma format
```

**Code Formatting**:
```bash
# Format code
pnpm lint

# Format Tailwind classes
# (handled automatically by editor integration)
```

## File Structure Reference

```
/vercel/share/v0-project/
├── .env.local              ← CREATE THIS FILE (with DATABASE_URL & SESSION_SECRET)
├── app/                    ← Application pages and routes
│   ├── page.tsx           ← Entity user dashboard
│   ├── login/page.tsx     ← Login page
│   └── admin/page.tsx     ← Admin dashboard
├── components/            ← React components
├── lib/                   ← Utilities (auth, etc.)
├── prisma/
│   └── schema.prisma      ← Database schema
├── scripts/
│   └── init-db.js         ← Demo data script
├── middleware.ts          ← Auth middleware
├── package.json           ← Dependencies
├── SETUP.md              ← Full setup guide
├── DATABASE_SETUP.md     ← Database guide
├── QUICK_START.md        ← Quick reference
└── PROJECT_SUMMARY.md    ← Project overview
```

## Getting Help

1. **Check Documentation**
   - `SETUP.md` - Comprehensive setup
   - `DATABASE_SETUP.md` - Database issues
   - `QUICK_START.md` - Common commands
   - `PROJECT_SUMMARY.md` - Architecture overview

2. **Browser Console**
   - Open DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for API issues

3. **Terminal Output**
   - Read error messages carefully
   - Check for typos in environment variables
   - Ensure all processes are running

4. **Common Issues**
   - PostgreSQL not running → Start the service
   - Database doesn't exist → Run `createdb`
   - Wrong password → Update `.env.local`
   - Port in use → Use different port

## Success!

Once you see the dashboard load with data, you're ready to:
- ✅ Explore the UI
- ✅ Understand the code
- ✅ Customize for your needs
- ✅ Deploy to production

---

**Need help?** Review the troubleshooting section above or check the full documentation files.

Happy coding! 🚀
