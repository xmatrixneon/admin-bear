# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MeowSMS Admin Dashboard - A Next.js 16 admin panel for managing a virtual number service platform.

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with custom admin token-based auth
- **UI Framework**: shadcn/ui components with Tailwind CSS v4
- **State**: React Query (TanStack Query) for server state, client useState
- **Charts**: Recharts for data visualization
- **Animations**: Framer Motion

### Directory Structure
```
app/                      # Next.js App Router
├── api/               # API routes
│   ├── auth/           # Authentication endpoints
│   └── admin/          # Admin-only API routes (protected)
├── dashboard/          # Admin dashboard pages
├── generated/          # Prisma client (auto-generated)
├── login/              # Login page
├── layout.tsx          # Root layout with theme provider
components/             # React components
├── ui/                 # shadcn/ui components
lib/                    # Utility libraries
├── auth.ts            # Better Auth config & utilities
├── api.ts             # API client for admin requests
├── db.ts              # Prisma client singleton
└── utils.ts           # Utility functions (formatCurrency, formatDateTime, etc.)
prisma/                # Database schema & seed
public/                 # Static assets
```

### Database Schema (Key Models)
- **User**: Telegram integration, wallet, admin flag, soft delete
- **Wallet**: Balance tracking, transaction history, OTP count
- **Transaction**: Deposits, purchases, refunds with UTR tracking
- **ActiveNumber**: Virtual phone numbers with SMS content storage
- **Service**: SMS/Telegram services with pricing
- **OtpServer**: External API servers (5SIM, SMS-Activate)
- **Promocode**: Discount system with usage tracking
- **Settings**: Application-wide settings
- **UserAuditLog**: All admin actions are logged

## Development Commands

```bash
# Development
npm run dev              # Start development server (localhost:3000)

# Build
npm run build            # Production build
npm start                # Start production server

# Database
npm run postinstall       # Generate Prisma client after install
npx prisma db push     # Push schema changes to database
npx prisma db seed      # Seed initial admin user

# Linting
npm run lint            # Run ESLint
```

## API Architecture

### Admin Routes (protected via token)
All admin routes expect `Authorization: Bearer <token>` header:
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - User management
- `GET /api/admin/wallets` - Wallet information
- `GET /api/admin/transactions` - Transaction history
- `GET /api/admin/transactions/stats` - Transaction analytics
- `GET /api/admin/services` - Service management
- `GET /api/admin/servers` - Server configuration
- `GET /api/admin/promocodes` - Promo code management
- `GET /api/admin/settings` - App settings
- `GET /api/admin/audit-logs` - Audit trail

### API Client Usage
Use `lib/api.ts` for type-safe API calls:
```typescript
import { api } from "@/lib/api";

// Example: Fetch users
const users = await api.getUsers({ page: 1, pageSize: 20 });

// Example: Update settings
await api.updateSettings({ maintenanceMode: true });
```

## Authentication

### Admin Login
- Environment variables: `ADMIN_USERNAME`, `ADMIN_PASSWORD` (set in .env)
- Login returns a JWT token stored in `localStorage.admin_token`
- Token verification via `lib/auth.ts:verifyAdminToken()`

### Better Auth Integration
- Cookie-based sessions for regular users
- Configured in `lib/auth.ts` with custom adapter
- Session type available via `User` and `Session` exports

## Key Patterns

### Type Safety
- Always use `as any` or explicit type annotations when API responses are unknown
- Prisma generates TypeScript types - import from `app/generated/prisma/client`
- For map/reduce callbacks: `array.map((item: any, index: number) => ...)`

### State Management
- Server state: Use React Query (TanStack Query) via custom hooks
- Client state: Use `useState` for simple form/UI state
- Data fetching: `await api.method()` with try/catch

### UI Components
- shadcn/ui components in `components/ui/`
- Use existing components before creating new ones
- Forms use controlled inputs with proper validation
- Loading states: Use `Skeleton` components

### Error Handling
```typescript
try {
  const result = await api.someMethod();
  // Handle success
} catch (err: any) {
  toast.error(err.message || "Operation failed");
  // Optional: setError(err.message)
}
```

## Database Transaction Types
From Prisma enum `TransactionType`:
- `DEPOSIT` - User added funds
- `PURCHASE` - User bought a service
- `REFUND` - Money returned to user
- `PROMO` - Promo code credit
- `REFERRAL` - Referral bonus
- `ADJUSTMENT` - Admin balance change

## Important Notes

### Build Issues
- The build was recently converted from tRPC to a direct API client
- Some pages may have incomplete type annotations (use `as any` where needed)
- Prisma client requires database connection for production builds

### Admin Credentials
Default admin credentials (for initial login):
- Username: Check `ADMIN_USERNAME` in `.env`
- Password: Check `ADMIN_PASSWORD` in `.env`
- Change these after first login!

### Audit Logging
All admin actions are automatically logged. When modifying data through API routes:
- The `verifyAdminToken()` middleware handles token validation
- UserAuditLog records `userId` (target), `adminId` (performer), `action`, and `reason`

### Configuration Files
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript with `@/*` path aliases
- `tailwind.config.ts` - CSS framework setup
- `prisma/schema.prisma` - Database definitions

### Environment Variables Required
```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-password
```
