# CROW MARKET

Marketplace de productos digitales + Creator Studio con IA + afiliados (5 niveles) + wallet USDT + admin.

## Requisitos

- Node.js 20+
- Sin servicios externos para desarrollo (SQLite local via `prisma/dev.db`)

## Arranque local

```bash
npm install
npm run setup   # prisma db push + seed demo
npm run dev     # http://localhost:3000
```

## Verificaciones

```bash
npm run typecheck
npm run lint
npm run build
```

## Cuentas demo (password: `crow12345`)

| Rol | Email |
|---|---|
| Admin | admin@crow.market |
| Creator | creator@crow.market |
| Creator | creator2@crow.market |
| Creator | creator3@crow.market |
| Affiliate | affiliate@crow.market |
| Affiliate | affiliate2@crow.market |
| Affiliate | affiliate3@crow.market |
| Buyer | buyer@crow.market |
| Buyer | buyer2@crow.market |

## Flujo principal

Landing `/` → Marketplace `/marketplace` → Producto `/marketplace/[slug]` →
Login `/login` → Dashboard `/dashboard` → Creator Studio `/creator/studio` →
Crear producto → Preview → Publish → visible en Marketplace.

## Notas

- IA: `GROQ_API_KEY` / `NVIDIA_API_KEY` opcionales. Sin keys, el Studio usa modo demo determinista.
- Pagos: USDT BEP-20 en modo intent + confirmación manual/admin vía `/api/webhooks/payments`.
- Retiros: mínimo 25 USDT, fee 3% diario / 2% mensual, aprobación admin.
- Producción PostgreSQL: cambiar `provider` a `postgresql` en `prisma/schema.prisma` y usar `DATABASE_URL` postgres.
