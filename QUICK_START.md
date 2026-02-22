# SHIESA Billing Platform - Quick Start

## 30-Second Setup

### 1. Create `.env.local`
```env
DATABASE_URL="postgresql://user:password@localhost:5432/shiesa_billing"
SESSION_SECRET="your-random-32-char-secret-key-here"
```

### 2. Run Setup
```bash
pnpm install
npx prisma migrate deploy
node scripts/init-db.js
pnpm dev
```

### 3. Login
- Open `http://localhost:3000/login`
- **Admin**: `admin@shiesa.com` / `demo123`
- **User**: `user@techsolutions.com` / `demo123`

## Essential Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Build for production |
| `pnpm start` | Run production build |
| `npx prisma studio` | View database GUI |
| `npx prisma migrate dev` | Create new migration |
| `npx prisma migrate reset` | Reset database (DELETE DATA) |
| `node scripts/init-db.js` | Seed demo data |

## Database Setup Checklist

- [ ] PostgreSQL installed and running
- [ ] Database created: `createdb shiesa_billing`
- [ ] `.env.local` file with DATABASE_URL and SESSION_SECRET
- [ ] Dependencies installed: `pnpm install`
- [ ] Migrations run: `npx prisma migrate deploy`
- [ ] Demo data seeded: `node scripts/init-db.js`

## File Locations

**Important Files:**
- `.env.local` - Environment variables (create this)
- `prisma/schema.prisma` - Database schema
- `middleware.ts` - Auth middleware
- `app/api/auth/login/route.ts` - Login endpoint
- `lib/auth.ts` - Auth utilities

**Key Dashboards:**
- Entity User: `app/page.tsx` (route: `/`)
- Admin: `app/admin/page.tsx` (route: `/admin`)
- Login: `app/login/page.tsx` (route: `/login`)

## Troubleshooting

**Database won't connect:**
```bash
# Check PostgreSQL is running
psql -U postgres -l

# Verify DATABASE_URL format
# postgresql://user:password@localhost:5432/dbname
```

**Missing tables:**
```bash
npx prisma migrate deploy
npx prisma migrate reset
```

**Demo data not appearing:**
```bash
node scripts/init-db.js
```

**Need to inspect database:**
```bash
npx prisma studio
```

## Next Steps

1. ✅ Complete setup above
2. 📊 Explore Admin Dashboard (`/admin`)
3. 📈 Explore Entity Dashboard (`/`)
4. 🔧 Customize demo data in `scripts/init-db.js`
5. 🎨 Modify colors in component files
6. 📝 Review full docs in `SETUP.md` and `PROJECT_SUMMARY.md`

## Key Features

✨ **Implemented:**
- Dual-role authentication (Admin + Entity User)
- 8 different pages with full functionality
- Database integration with Prisma + PostgreSQL
- Data visualization with charts
- Role-based access control
- Responsive design
- Demo data included

## Demo Routes

### Entity User (Role: ENTITY_USER)
- `/` - Dashboard
- `/invoices` - Invoice management
- `/suppliers` - Supplier management
- `/reports` - Reports
- `/settings` - Settings

### Super Admin (Role: SUPER_ADMIN)
- `/admin` - Dashboard
- `/admin/entities` - Entity management
- `/admin/compliance` - Compliance monitoring
- `/admin/analytics` - Platform analytics
- `/settings` - Settings

### Public
- `/login` - Login page

## Pro Tips

- **View Database**: `npx prisma studio`
- **Clear Sessions**: Delete cookies in browser dev tools
- **Reset Everything**: `npx prisma migrate reset && node scripts/init-db.js`
- **Check Logs**: Open browser DevTools console for errors
- **Hot Reload**: All changes auto-reload in dev mode

## Support

- 📖 Full setup guide: See `SETUP.md`
- 💾 Database help: See `DATABASE_SETUP.md`
- 📋 Project overview: See `PROJECT_SUMMARY.md`
- 🐛 Issues: Check browser console and terminal output

---

**Ready?** Run `pnpm dev` and start building! 🚀
