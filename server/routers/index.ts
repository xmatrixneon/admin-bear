import { router } from '../trpc';
import { statsRouter } from './stats';
import { usersRouter } from './users';
import { transactionsRouter } from './transactions';
import { servicesRouter } from './services';
import { serversRouter } from './servers';
import { promocodesRouter } from './promocodes';
import { auditLogsRouter } from './audit-logs';
import { settingsRouter } from './settings';
import { walletsRouter } from './wallets';
import { loginRouter } from './login';

/**
 * Main tRPC router for the admin panel
 * Aggregates all domain-specific routers
 */
export const adminRouter = router({
  login: loginRouter,
  stats: statsRouter,
  users: usersRouter,
  transactions: transactionsRouter,
  services: servicesRouter,
  servers: serversRouter,
  promocodes: promocodesRouter,
  auditLogs: auditLogsRouter,
  settings: settingsRouter,
  wallets: walletsRouter,
});

/**
 * Type export for tRPC client
 */
export type AdminRouter = typeof adminRouter;
