# Database Setup Instructions

## Quick Start

### 1. Create `.env.local` file

```env
DATABASE_URL="postgresql://username:password@localhost:5432/shiesa_billing"
SESSION_SECRET="generate-a-random-secret-key-min-32-characters"
```

### 2. Initialize Database

```bash
# Install dependencies first
pnpm install

# Run Prisma migrations
npx prisma migrate deploy

# Seed demo data
node scripts/init-db.js
```

## Database Options

### Option 1: Local PostgreSQL
1. Install PostgreSQL locally
2. Create database: `createdb shiesa_billing`
3. Update DATABASE_URL: `postgresql://postgres:password@localhost:5432/shiesa_billing`
4. Run migrations and seed data

### Option 2: Vercel PostgreSQL
1. Connect Postgres in Vercel project settings
2. Copy DATABASE_URL from environment variables
3. Add to `.env.local`
4. Run migrations and seed data

### Option 3: External Hosted Database
1. Get connection string from provider (Neon, AWS RDS, etc.)
2. Add to `.env.local`
3. Run migrations and seed data

## Demo Data

The `scripts/init-db.js` script creates:

- **2 Demo Users**:
  - Super Admin: `admin@shiesa.com` / `demo123`
  - Entity User: `user@techsolutions.com` / `demo123`

- **1 Demo Entity**: Tech Solutions Inc

- **2 Demo Suppliers**: Global Supplies Ltd, Premium Services Co

- **5 Demo Invoices**: With various statuses (Paid, Pending, Cancelled)

- **Demo Transactions**: Income and expense transactions

## Prisma Commands

```bash
# View database
npx prisma studio

# Create migration (if you modify schema.prisma)
npx prisma migrate dev --name migration_name

# Reset database (DELETE ALL DATA)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

## Schema Overview

```sql
-- Users table
- id, email, password, fullName, role, entityId

-- Entity table
- id, name, registrationNumber, email, phone, address, status

-- Invoice table
- id, entityId, invoiceNumber, supplierId, amount, status

-- Supplier table
- id, entityId, name, email, phone, status

-- Transaction table
- id, entityId, type, amount, category

-- Report table
- id, entityId, reportType, generatedDate
```

## Troubleshooting

**Error: "Could not connect to the database server"**
- Check PostgreSQL is running
- Verify DATABASE_URL format
- Ensure database exists

**Error: "relation does not exist"**
- Run: `npx prisma migrate deploy`
- Or: `npx prisma migrate reset`

**No demo data after setup**
- Run: `node scripts/init-db.js`

**"Prisma Client was already instantiated"**
- Restart dev server: `pnpm dev`

## Environment Variables

| Variable | Required | Example |
|----------|----------|---------|
| DATABASE_URL | Yes | postgresql://user:pass@localhost:5432/shiesa_billing |
| SESSION_SECRET | Yes | abc123...xyz (min 32 chars) |
| NODE_ENV | Optional | development, production |

## Next Steps

1. Set up database connection
2. Run migrations
3. Seed demo data
4. Start dev server: `pnpm dev`
5. Login at `http://localhost:3000/login`

For more information, see `SETUP.md`
