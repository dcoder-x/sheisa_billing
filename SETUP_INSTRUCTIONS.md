## SHIESA Billing Platform - Setup Instructions

Follow these steps to get your application running:

### Step 1: Install Dependencies

```bash
pnpm install
```

### Step 2: Generate Prisma Client

This is critical - the Prisma client must be generated before you can run the app.

```bash
npx prisma generate
```

You should see output like:
```
✔ Generated Prisma Client (5.x.x) to ./node_modules/@prisma/client in XXms
```

### Step 3: Set Up Environment Variables

Create a `.env.local` file in the project root with your database credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/shiesa_billing"
SESSION_SECRET="your-random-secret-key-minimum-32-characters-long"
```

**Important:**
- `DATABASE_URL`: Your PostgreSQL connection string
  - Format: `postgresql://[user]:[password]@[host]:[port]/[database]`
  - Example for local dev: `postgresql://postgres:password@localhost:5432/shiesa_billing`
- `SESSION_SECRET`: A random string (32+ characters) for JWT signing
  - Generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Step 4: Create Database & Run Migrations

Choose one based on your setup:

**For Production/Testing (Migrations):**
```bash
npx prisma migrate deploy
```

**For Development (Recommended):**
```bash
npx prisma db push
```

The `db push` command is faster for development and automatically syncs your schema.

### Step 5: Seed Demo Data

```bash
node scripts/init-db.js
```

This creates demo accounts and test data:
- **Admin Account:**
  - Email: `admin@shiesa.com`
  - Password: `demo123`
  
- **Entity User Account:**
  - Email: `user@techsolutions.com`
  - Password: `demo123`

### Step 6: Start the Development Server

```bash
pnpm dev
```

Your application will be available at: `http://localhost:3000`

### Troubleshooting

#### Error: "Cannot find module '.prisma/client'"

**Solution:** You skipped Step 2. Run:
```bash
npx prisma generate
```

#### Error: "database connection refused"

**Solution:** 
1. Check your `DATABASE_URL` in `.env.local` is correct
2. Ensure PostgreSQL is running and accessible
3. Verify the database exists and the user has access

#### Error: "relation \"User\" does not exist"

**Solution:** You skipped Step 4. Run:
```bash
npx prisma db push
```

#### Port Already in Use

If port 3000 is in use, run:
```bash
pnpm dev -- -p 3001
```

### Database Setup for Different PostgreSQL Providers

#### Local PostgreSQL (macOS with Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
psql postgres -c "CREATE DATABASE shiesa_billing;"
# Your DATABASE_URL: postgresql://postgres@localhost:5432/shiesa_billing
```

#### Docker PostgreSQL
```bash
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15
# Your DATABASE_URL: postgresql://postgres:password@localhost:5432/postgres
# (after creating database: postgresql://postgres:password@localhost:5432/shiesa_billing)
```

#### Cloud Providers
- **Vercel Postgres**: Copy connection string from dashboard
- **Neon**: Copy connection string from dashboard
- **Supabase**: Get connection string from project settings
- **AWS RDS**: Build URL from endpoint, port, username, password

### Verify Installation

Once running, test both dashboards:

1. **Login Page**: `http://localhost:3000/login`
2. **Admin Dashboard**: Log in with `admin@shiesa.com` / `demo123`
3. **Entity User Dashboard**: Log in with `user@techsolutions.com` / `demo123`

You should see:
- ✓ Login page loads
- ✓ Demo credentials work
- ✓ Dashboards display with sample data
- ✓ Navigation works between pages

### Next Steps

After setup:
1. Explore both dashboards with demo credentials
2. Review the architecture in `PROJECT_SUMMARY.md`
3. Customize the database schema in `prisma/schema.prisma`
4. Deploy to Vercel (see `SETUP.md` for deployment guide)

### Need Help?

- **Prisma Docs**: https://www.prisma.io/docs/
- **Next.js Docs**: https://nextjs.org/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

**Quick Setup Checklist:**
- [ ] `pnpm install`
- [ ] `npx prisma generate`
- [ ] Create `.env.local` with DATABASE_URL and SESSION_SECRET
- [ ] `npx prisma db push` (or `npx prisma migrate deploy`)
- [ ] `node scripts/init-db.js`
- [ ] `pnpm dev`
- [ ] Visit `http://localhost:3000/login`
