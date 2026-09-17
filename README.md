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

## Distribución comercial CROW (matriz fija — siempre 100%)

| Participante | Normal | Primer desbloqueo L1 |
|---|---:|---:|
| Creator | 45% | 45% |
| CROW / PLATFORM (fijo, nunca absorbe residual) | 10% | 10% |
| Afiliado directo | 30% | 30% |
| L1 | 5% | 2.5% |
| Emergency Reserve (solo esta excepción, no es línea permanente) | — | 2.5% |
| L2 | 3% | 3% |
| L3 | 2% | 2% |
| L4 | 2% | 2% |
| L5 | 1% | 1% |
| Rewards Pool (línea explícita del split) | 2% | 2% |
| **Total** | **100%** | **100%** |

- Las comisiones no asignables (sin beneficiario, usuario inactivo o afiliado
  inactivo/no elegible) van a **CROW Treasury** con rol original, beneficiario y
  motivo preservados. Treasury nunca infla el 10% de CROW/PLATFORM.
- Rewards Pool y Emergency Reserve son buckets de CROW: se registran como
  `Transaction` (nunca como comisiones de usuario ni saldos de wallet).
- Verificación matemática sin base de datos + regresión con base de datos:

```bash
npm run test:commissions
npm run test:attribution
```
