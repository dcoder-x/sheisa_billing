# SHIESA Billing Platform

A comprehensive, production-ready billing and invoice management platform with dual role-based dashboards, authentication, and PostgreSQL database integration.

## 🎯 What This Is

SHIESA is a complete billing management system with:
- **Super Admin Dashboard**: Platform governance, entity management, compliance monitoring
- **Entity User Dashboard**: Invoice management, supplier handling, operational billing
- **Secure Authentication**: JWT-based sessions with HTTP-only cookies
- **Real Database**: PostgreSQL integration with Prisma ORM
- **Beautiful UI**: Clean, responsive design matching RealSpine inspiration
- **Full Documentation**: Step-by-step guides and architecture docs

## 📖 Documentation

Start here based on your needs:

| Document | Purpose |
|----------|---------|
| **[BUILD_COMPLETE.md](BUILD_COMPLETE.md)** | Overview of what was built |
| **[INSTALLATION.md](INSTALLATION.md)** | 👈 **START HERE** - Step-by-step setup guide |
| **[QUICK_START.md](QUICK_START.md)** | Quick reference with commands |
| **[DATABASE_SETUP.md](DATABASE_SETUP.md)** | Database-specific instructions |
| **[SETUP.md](SETUP.md)** | Comprehensive setup and deployment |
| **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** | Complete project overview |

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ and pnpm
- PostgreSQL 12+
- Code editor

### 2. Setup in 5 Minutes

**Create `.env.local`:**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/shiesa_billing"
SESSION_SECRET="your-random-secret-key-min-32-characters"
```

**Initialize database:**
```bash
pnpm install
npx prisma migrate deploy
node scripts/init-db.js
```

**Start dev server:**
```bash
pnpm dev
```

**Login at `http://localhost:3000`:**
- Admin: `admin@shiesa.com` / `demo123`
- User: `user@techsolutions.com` / `demo123`

**👉 See [INSTALLATION.md](INSTALLATION.md) for detailed setup with troubleshooting**

## 🎨 Features

### Authentication
- ✅ Secure login page
- ✅ JWT session management
- ✅ Password hashing with bcryptjs
- ✅ Route protection middleware
- ✅ HTTP-only secure cookies

### Super Admin Dashboard (`/admin`)
- Platform overview with KPIs
- Entity management table
- Revenue trend charts
- Compliance monitoring
- Platform analytics
- Entity management pages

### Entity User Dashboard (`/`)
- Income/expense tracking
- Invoice management
- Supplier management
- Sales analytics charts
- Property management
- Reports generation

### Pages
```
/login                    Login
/                        Entity Dashboard
/invoices                Invoice Management
/suppliers               Supplier Management
/reports                 Reports & Download
/settings                Settings
/admin                   Admin Dashboard
/admin/entities          Entity Management
/admin/compliance        Compliance Monitor
/admin/analytics         Platform Analytics
```

### Database
- User management with roles
- Entity organization records
- Invoice tracking and status
- Supplier information
- Transaction logging
- Report generation

### UI Components
- Responsive sidebar navigation
- Header with search and notifications
- KPI cards with indicators
- Data visualization with Recharts
- Data tables with search/filter
- Status badges
- Form components
- And more...

## 🏗️ Technology Stack

**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, Recharts, Lucide React

**Backend:** Next.js API Routes, Prisma ORM, PostgreSQL, bcryptjs, jose

**Development:** Turbopack, pnpm, ESLint

## 📁 Project Structure

```
├── app/
│   ├── api/auth/              # Authentication routes
│   ├── admin/                 # Admin pages
│   ├── login/                 # Login page
│   ├── invoices/              # Invoice management
│   ├── suppliers/             # Supplier management
│   ├── reports/               # Reports page
│   ├── settings/              # Settings
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Entity dashboard
├── components/
│   ├── sidebar.tsx            # Navigation sidebar
│   ├── header.tsx             # Header component
│   ├── entity-dashboard.tsx   # Entity dashboard
│   ├── admin-dashboard.tsx    # Admin dashboard
│   ├── [tables].tsx           # Data table components
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── auth.ts               # Authentication logic
│   └── utils.ts              # Utilities
├── prisma/
│   └── schema.prisma         # Database schema
├── scripts/
│   └── init-db.js            # Demo data
├── middleware.ts             # Auth middleware
├── package.json              # Dependencies
└── [documentation files]     # Setup guides
```

## 🔐 Security Features

- ✅ Passwords hashed with bcryptjs (10 salt rounds)
- ✅ JWT tokens with 24-hour expiration
- ✅ HTTP-only cookies (not accessible to JavaScript)
- ✅ Secure flag set for HTTPS
- ✅ SameSite=Lax for CSRF protection
- ✅ Session validation on every request
- ✅ SQL injection prevention via Prisma
- ✅ Role-based access control

## 📊 Demo Data

Ready to use out of the box:
- 2 users (Super Admin + Entity User)
- 1 demo organization
- 2 demo suppliers
- 5 demo invoices with various statuses
- 5 demo transactions
- Full contact information

## 🎯 Use Cases

This platform is perfect for:
- **Billing Services**: Manage invoices and payments
- **Multi-tenant Systems**: Separate admin and user dashboards
- **Financial Management**: Track income and expenses
- **Vendor Management**: Manage supplier relationships
- **Compliance Tracking**: Monitor entity compliance
- **Analytics & Reporting**: Generate insights and reports

## 🚀 Deployment

### To Production:

1. **Database**: Use managed service (Vercel PostgreSQL, AWS RDS, Neon, etc.)
2. **Hosting**: Deploy to Vercel (recommended for Next.js)
3. **Secrets**: Set environment variables securely
4. **Session Secret**: Use strong random value (minimum 32 characters)
5. **HTTPS**: Enforced by default in production
6. **Rate Limiting**: Consider adding on auth endpoints

See [SETUP.md](SETUP.md) for detailed production deployment guide.

## 📝 Development

### Run Dev Server
```bash
pnpm dev
```

### View Database
```bash
npx prisma studio
```

### Lint & Format
```bash
pnpm lint
```

### Build Production
```bash
pnpm build
pnpm start
```

## 🛠️ Customization

### Adding New Pages
1. Create directory in `app/`
2. Add `page.tsx` with `getSession()` validation
3. Use `Sidebar` and `Header` components

### Changing Colors
Edit color classes in component files and `tailwind.config.ts`

### Modifying Demo Data
Update `scripts/init-db.js` before running seed

### Adding Database Models
1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name name`
3. Update components as needed

## 🐛 Troubleshooting

### Common Issues

**"Could not connect to database"**
- Ensure PostgreSQL is running
- Check DATABASE_URL format
- Verify database exists

**"Relation does not exist"**
- Run: `npx prisma migrate deploy`
- Or: `npx prisma migrate reset` (deletes all data)

**"Session not found"**
- Clear browser cookies
- Check SESSION_SECRET is set
- Ensure .env.local exists

**"No demo data"**
- Run: `node scripts/init-db.js`

See [INSTALLATION.md](INSTALLATION.md) for more troubleshooting.

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Recharts](https://recharts.org)

## 📄 License

This project was created with [v0.app](https://v0.app)

## 🎉 Get Started

1. **Read:** [INSTALLATION.md](INSTALLATION.md)
2. **Setup:** Follow the step-by-step guide
3. **Run:** `pnpm dev`
4. **Explore:** Login with demo credentials
5. **Customize:** Make it your own

---

**Questions?** Check the documentation files for detailed guides and troubleshooting.

**Ready?** Open [INSTALLATION.md](INSTALLATION.md) and start building! 🚀
#   s h e i s a _ b i l l i n g  
 