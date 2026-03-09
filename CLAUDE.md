# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

## Project Overview

MeowSMS Admin Dashboard - A Next.js 16 admin panel for managing a virtual number service platform. Uses tRPC for type-safe API communication between frontend and backend.

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **API Layer**: tRPC with React Query integration
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with custom admin token-based auth
- **UI Framework**: shadcn/ui components with Tailwind CSS v4
- **Charts**: Recharts for data visualization
- **Animations**: Framer Motion

### Directory Structure
```
app/                      # Next.js App Router
├── api/trpc/[trpc]/      # tRPC API handler
├── api/auth/             # Authentication endpoints
├── dashboard/            # Admin dashboard pages
├── generated/prisma/     # Prisma client (auto-generated)
├── layout.tsx            # Root layout with TrpcProvider
components/
├── ui/                   # shadcn/ui components
├── providers.tsx         # TrpcProvider component
└── admin/                # Admin-specific components
lib/
├── auth.ts               # Better Auth config & admin token utilities
├── trpc.ts               # tRPC React client
├── db.ts                 # Prisma client singleton
└── utils.ts              # Utility functions (formatCurrency, formatDateTime, cn, toNumber)
server/
├── trpc.ts               # tRPC server setup (protectedProcedure, publicProcedure)
├── context.ts            # tRPC context with prisma & admin
└── routers/              # Domain-specific tRPC routers
    ├── _app.ts           # Router exports
    ├── index.ts          # Main adminRouter aggregation
    ├── stats.ts          # Dashboard statistics
    ├── users.ts          # User management
    ├── wallets.ts        # Wallet operations
    ├── transactions.ts   # Transaction history
    ├── services.ts       # Service management
    ├── servers.ts        # OTP server config
    ├── promocodes.ts     # Promo code CRUD
    ├── settings.ts       # App settings
    ├── audit-logs.ts     # Audit trail
    └── login.ts          # Admin login
prisma/schema.prisma      # Database schema
```

## Development Commands

```bash
npm run dev               # Start development server (localhost:3000)
npm run build             # Production build
npm start                 # Start production server
npm run lint              # Run ESLint
npm run postinstall       # Generate Prisma client
npx prisma db push        # Push schema changes to database
npx prisma db seed        # Seed initial admin user
```

## tRPC API Architecture

### Using tRPC in Frontend Components
```typescript
import { trpc } from "@/lib/trpc";

// Queries (with auto-generated types)
const { data, isLoading, refetch } = trpc.stats.getDashboardStats.useQuery();
const { data } = trpc.users.list.useQuery({ page: 1, pageSize: 20 });

// Mutations
const mutation = trpc.users.update.useMutation({
  onSuccess: () => { refetch(); toast.success("Updated"); },
  onError: (err) => toast.error(err.message),
});
mutation.mutate({ id: "xyz", name: "New Name" });
```

### Creating New tRPC Procedures
Routers are in `server/routers/`. Use `protectedProcedure` for admin-only endpoints:

```typescript
// server/routers/example.ts
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';

export const exampleRouter = router({
  getData: protectedProcedure.query(async ({ ctx }) => {
    // ctx.prisma and ctx.admin are available
    return ctx.prisma.user.findMany();
  }),

  updateItem: protectedProcedure
    .input(z.object({ id: z.string(), value: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.item.update({ where: { id: input.id }, data: { value: input.value } });
    }),
});
```

Register new routers in `server/routers/index.ts`.

### Available Routers
- `login` - Admin authentication
- `stats` - Dashboard statistics (getDashboardStats, getTransactionStats, getRechargeSpentChart)
- `users` - User CRUD and management
- `wallets` - Wallet queries and balance adjustments
- `transactions` - Transaction history and stats
- `services` - Service CRUD
- `servers` - OTP server management
- `promocodes` - Promo code CRUD
- `settings` - App settings (singleton)
- `auditLogs` - Audit log queries

## Authentication Flow

### Admin Login
1. POST to `/api/auth/admin/login` with `{ username, password }`
2. Credentials validated against `ADMIN_USERNAME` and `ADMIN_PASSWORD` env vars
3. Returns a base64-encoded token stored in `localStorage.admin_token`
4. Token automatically attached to all tRPC requests via `TrpcProvider` headers

### Token Verification
- `verifyAdminToken(token)` in `lib/auth.ts` decodes and checks expiry
- tRPC middleware in `server/trpc.ts` validates token and adds `ctx.admin`

## Database Enums (from schema.prisma)

```typescript
TransactionType: DEPOSIT | PURCHASE | REFUND | PROMO | REFERRAL | ADJUSTMENT
TransactionStatus: PENDING | COMPLETED | FAILED
NumberStatus: COMPLETED | PENDING | CANCELLED
ActiveStatus: ACTIVE | CLOSED
DiscountType: FLAT | PERCENT
UserStatus: ACTIVE | BLOCKED | SUSPENDED  // Use enum, never raw strings
```

## Key Patterns

### Type Safety with Prisma
- Import Prisma types from `app/generated/prisma/client`
- Use `as any` sparingly for complex API response shapes
- For map/reduce callbacks: `array.map((item: any, index: number) => ...)`

### Utility Functions (lib/utils.ts)
```typescript
cn(...inputs)              // Tailwind class merge
toNumber(value)            // Safe number conversion (handles Decimal, BigInt, string)
formatCurrency(value)      // INR formatting: ₹1,234.56
formatDate(date)           // 09 Mar 2026
formatDateTime(date)       // 09 Mar 2026, 02:30 PM
```

### UI Components
- All pages use `"use client"` directive
- Loading states: Use `Skeleton` from `components/ui/skeleton`
- Toasts: Use `sonner` - `import { toast } from "sonner"`
- Forms: Use `react-hook-form` with `zod` validation via `@hookform/resolvers`

## Environment Variables

```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-password
```

## Important Notes

### Audit Logging
All admin data modifications should log to `UserAuditLog`. The model tracks `userId` (target), `adminId` (performer), `action`, `changes` (JSON), and `reason`.

### Database Constraints
- Wallet balance/totalSpent/totalOtp/totalRecharge have CHECK constraints for non-negative
- Transaction amount is always positive (sign determined by type)
- `txnId` unique for deposits (UTR deduplication)
- `refundOrderId` unique for refunds (prevents double-refunds)

### Prisma Client Location
Generated at `app/generated/prisma/client` - import via `lib/db.ts`:
```typescript
import { prisma } from "@/lib/db";
```
