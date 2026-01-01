import type { Config } from 'drizzle-kit';
import { resolveDatabasePath } from '@/lib/db.mjs';

export default {
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: resolveDatabasePath(),
  },
} satisfies Config;
