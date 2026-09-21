# Pagos CROW — piloto BSC TESTNET (97)

## Estado verificado

Checkout, monitor, confirmación RPC y liquidación están implementados para compras de productos. Tests de integración usan respuestas JSON-RPC controladas y Prisma real; no son transferencias on-chain. Se comprobó que dos RPC públicos responden chain ID 97, pero **no se completó un pago real**: faltan una dirección receptora válida y un contrato/token de prueba financiado. No hay mainnet habilitada.

Tether no publica un contrato oficial USDt para BSC Testnet en su página de protocolos soportados. `PAYMENT_TOKEN_ADDRESS` debe ser un BEP-20 de prueba conocido, sin valor, cuyo contrato se haya revisado. No confundirlo con USDt real ni con la wallet receptora. No usar direcciones copiadas de ejemplos sin verificar su código y red.

## Entorno aislado obligatorio

Usar una instancia y DATABASE_URL exclusivos del piloto: las comisiones se calculan con las mismas reglas y se registran en wallets de esa base. **No conectar el piloto a una base con saldos reales ni operar retiros desde sus saldos de prueba.** No se modificaron reglas de retiros ni porcentajes. Boost, licencias y planes no se incorporaron al nuevo monitor; las antiguas confirmaciones simuladas públicas están deshabilitadas.

En `c:\Users\gabii\Desktop\crow-final\.env`:

- `DATABASE_URL`: base SQLite exclusiva para testnet, por ejemplo `file:./payments-testnet.db`.
- `PAYMENT_CHAIN_ID=97` (cualquier otra red se rechaza).
- `PAYMENT_BSC_RPC_URL`: RPC BSC Testnet; por ejemplo `https://bsc-testnet-rpc.publicnode.com`.
- `PAYMENT_USDT_BEP20_ADDRESS`: dirección pública receptora controlada por CROW, NO contrato del token.
- `PAYMENT_TOKEN_ADDRESS`: contrato BEP-20 de prueba desplegado en esa red.
- `PAYMENT_TOKEN_DECIMALS`: decimales reales de ese contrato; se contrastan por RPC.
- `PAYMENT_REQUIRED_CONFIRMATIONS=12`.
- `PAYMENT_WEBHOOK_SECRET`: opcional, secreto aleatorio si se usa el webhook. Vacío deja el webhook cerrado. El monitor no lo necesita.
- Mantener `SESSION_SECRET` y las demás variables de la aplicación. Nunca poner seed phrases ni claves privadas.

Desde `c:\Users\gabii\Desktop\crow-final`:

```powershell
npm run db:push
# Solo si es una base nueva y vacía: npm run db:seed
npm run payments:check
npm run dev
# Otra terminal, misma ENV y base:
npm run payments:monitor
```

`payments:check` valida formato, red, bytecode y decimales. No demuestra legitimidad económica ni propiedad de una dirección. Un fallo bloquea nuevos checkouts y no acredita pagos. El monitor debe quedar activo (o ejecutar `npm run payments:monitor -- --once` desde un scheduler). Recupera su cursor de la base al reiniciarse.

## Pago de prueba

1. Usar una wallet EVM de navegador en BSC Testnet (97) con tBNB para gas y saldo del token configurado. Obtenerlos del faucet/emisor del token elegido, fuera de CROW.
2. Comprar un producto publicado de otro creador. Abrir el checkout nuevo.
3. Verificar orderId, importe exacto, contrato, destino y vencimiento. Pulsar **Pagar con wallet · BSC Testnet** y revisar/firmar en la wallet.
4. El botón llama `transfer(address,uint256)` del token con una referencia de orden añadida al calldata. El contrato de prueba debe admitir ese calldata; no se cambian importes para asociar órdenes. Una transferencia manual sin esa referencia NO se acredita automáticamente. No repetir el pago ni usar un exchange para enviarlo.
5. El monitor detecta el evento `Transfer`, valida recibo exitoso, referencia, token, destino, importe atómico, bloque canónico y confirmaciones. Una TX incluida antes del vencimiento puede terminar de confirmarse después; una transferencia incluida tarde no se acredita.
6. El checkout se refresca cada 10 segundos. Al ver **PAID**, comprobar la compra en la biblioteca. En `/admin/payments` se ven TX completa, origen, destino, monto, bloque, fecha, confirmaciones y estado. En `/admin/orders` el botón solo vuelve a verificar por RPC: no fuerza `PAID`.

Un registro único `chainId:txHash` persiste aunque se borre la orden. La liquidación registra PAID, comisiones, wallet y acceso dentro de la misma transacción: un fallo revierte todo. No borrar `BlockchainPaymentClaim` para reintentar. Los errores RPC/reorg quedan pendientes sin liberar acceso; requieren restablecer RPC o revisión si la TX desaparece definitivamente. No se revierte automáticamente un pago que sufra una reorganización profunda después de PAID; este piloto no afirma finalidad absoluta de blockchain.

Webhook opcional: `POST /api/webhooks/payments`, header `x-crow-signature`, JSON `{ "orderId": "...", "txHash": "0x..." }`. No acepta estado ni número de confirmaciones del remitente.

## Verificación automatizada

```powershell
npm run test:payments
npm run test:commissions
npm run test:attribution
npm run test:boost
npm run test:licenses
npm run typecheck
npm run lint
npm run build
```

Ejecutar suites de DB secuencialmente en una base de pruebas, no en producción. Cubren detección, confirmaciones, liquidación, replay, concurrencia, rollback tras escribir comisiones, token/destino/monto/red incorrectos, recibo fallido, reorg, vencimiento y cierre del webhook sin secreto. La validación de wallet/navegador y una TX real con un token válido sigue pendiente.
