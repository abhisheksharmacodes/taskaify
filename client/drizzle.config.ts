import type { Config } from "drizzle-kit";

// Helper to parse DATABASE_URL
function parseDatabaseUrl(url: string | undefined) {
  if (!url) return {};
  const match = url.match(
    /^postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:\/]+):(\d+)\/(.+)$/
  );
  if (!match) return {};
  const [, user, password, host, port, database] = match;
  return { user, password, host, port: Number(port), database };
}

const dbUrl = process.env.DATABASE_URL;
const parsed = parseDatabaseUrl(dbUrl);

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: parsed.host || process.env.PGHOST || '',
    port: parsed.port || (process.env.PGPORT ? Number(process.env.PGPORT) : 5432),
    user: parsed.user || process.env.PGUSER || '',
    password: parsed.password || process.env.PGPASSWORD || '',
    database: parsed.database || process.env.PGDATABASE || '',
    ssl: 'require',
  },
} satisfies Config;