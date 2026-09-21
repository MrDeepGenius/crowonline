# CROW MARKET — Deploy to PostgreSQL

## Steps

### 1. Set up the database

Create a PostgreSQL database and get your connection string:
```
postgresql://USER:PASSWORD@HOST:5432/crow_market?schema=public
```

Providers that work out of the box: Neon, Supabase, Railway, Render, AWS RDS.

### 2. Update `prisma/schema.prisma`

Change the datasource provider:
```prisma
datasource db {
  provider = "postgresql"   // ← change from "sqlite"
  url      = env("DATABASE_URL")
}
```

### 3. Set environment variables

Copy `.env.example` to `.env.production.local` (or set in your host's dashboard):

```bash
# Required
DATABASE_URL="postgresql://..."
SESSION_SECRET="<random 64-char string>"   # openssl rand -hex 32
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# AI (optional — app falls back to demo mode)
GROQ_API_KEY="..."
NVIDIA_API_KEY="..."
LEONARDO_API_KEY="..."

# Payments (BSC Testnet — chain 97)
PAYMENT_BSC_RPC_URL="https://data-seed-prebsc-1-s1.binance.org:8545"
PAYMENT_USDT_BEP20_ADDRESS="0x..."   # your receiving wallet
PAYMENT_TOKEN_ADDRESS="0x..."        # BEP-20 token contract
PAYMENT_CHAIN_ID="97"
PAYMENT_TOKEN_DECIMALS="18"
PAYMENT_REQUIRED_CONFIRMATIONS="12"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### 4. Generate Prisma client + run migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

`migrate deploy` applies all pending migrations without prompting.
It is safe to run on every deploy (idempotent).

### 5. Seed (only first deploy)

```bash
npx tsx prisma/seed.ts
```

### 6. Build and start

```bash
npm run build
npm start
```

---

## Switching back to SQLite (local dev)

1. Revert `provider` to `"sqlite"` in `schema.prisma`
2. Set `DATABASE_URL="file:./dev.db"`
3. Run `npx prisma db push`

---

## Notes

- `PAYMENTS_TEST_MODE` is **blocked** in `NODE_ENV=production` by code — it will never activate even if set to `"true"`.
- `SESSION_SECRET` must be set to a strong random value in production. The app will **throw at startup** if it detects the default dev value.
- The migration SQL in `prisma/migrations/20240101000000_init/migration.sql` is PostgreSQL-specific (`TIMESTAMP(3)`, `DOUBLE PRECISION`). It will not run against SQLite — use `prisma db push` for local dev instead.
