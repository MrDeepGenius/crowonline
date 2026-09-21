# PAYMENT TEST MODE — local, sin blockchain

Activar en `c:\Users\gabii\Desktop\crow-final\.env`:

```dotenv
PAYMENTS_TEST_MODE=true
```

Desde `c:\Users\gabii\Desktop\crow-final`, iniciar/reiniciar `npm run dev`.
No necesitas RPC, contrato, wallet externa, USDT ni el monitor. No activar `NODE_ENV=production`: la simulación está bloqueada allí, incluso con el flag en true. El flag solo acepta literalmente `true` y solo en development/test. No se añadió ningún interruptor público, query param ni webhook de simulación.

## Compra completa

1. Usar una base y usuarios de desarrollo; la prueba concede acceso real dentro de esa base local. Conservar el schema actual: este cambio no requiere migración ni reset. Si necesitas una base nueva, configurar una DATABASE_URL de desarrollo e inicializarla siguiendo el setup existente (el seed borra datos; no ejecutarlo en una base que quieras conservar).
2. Iniciar sesión como comprador y comprar un producto publicado de otro creador que todavía no esté en su biblioteca.
3. El checkout nuevo muestra **TEST MODE**, referencia `CROW-TEST-*`, estado pendiente y un destino que dice **NO ENVIAR FONDOS**.
4. Pulsar **TEST MODE · Confirmar pago simulado**. La acción interna valida sesión/propiedad, flag, entorno, tipo de orden, monto y vencimiento. No se aceptan TX ni montos desde el formulario.
5. La orden pasa a **PAID** y abre la biblioteca. Entrar al producto para verificar acceso. En `/admin/payments`, buscar la referencia: pago PAID, etiqueta TEST MODE y TX `TEST:<orderId>`. Recaudado excluye pagos locales TEST.
6. Entrar como creador o afiliado beneficiario y abrir `/wallet`: el movimiento tiene estado **TEST**, descripción **NO RETIRABLE** e importe de la comisión calculada por el motor existente. El saldo disponible y ganado real NO aumentan. Por ejemplo, venta directa de 100: comisión TEST del creador 45.

Las confirmaciones repetidas/concurrentes no duplican acceso, comisiones ni ledger. El registro de TX es único y todo se liquida dentro de una transacción. Pago y auditoría llevan modo TEST; comisiones, buckets y ledger quedan marcados TEST. No se alteran estadísticas de productos ni acumuladores de afiliados con ventas locales. Los porcentajes y las condiciones del cálculo siguen siendo los existentes.

## Fondos no retirables

Los créditos TEST nunca ingresan a availableUsdt, pendingUsdt ni totalEarnedUsdt. Esta separación depende del provider persistido, no de la ENV: apagar el flag o iniciar producción NO los convierte en saldo retirable. No se cambió el servicio ni las reglas de retiros; un usuario con solo créditos TEST recibe saldo insuficiente. Si tenía saldo real previo, ese saldo sigue disponible.

Para desactivar: `PAYMENTS_TEST_MODE=false` y reiniciar. Los pagos TEST históricos mantienen su etiqueta y no pueden confirmarse con el modo apagado. Los nuevos checkouts vuelven al flujo BSC Testnet existente (requiere sus ENV). Las órdenes BSC ya creadas nunca se convierten en TEST. El monitor, verificador y webhook blockchain no fueron modificados. Boost, Founder y licencias no usan esta simulación.

## Tests

```powershell
npm run test:payment-mode
npm run test:payments
npm run test:commissions
npm run test:attribution
npm run test:boost
npm run test:licenses
npm run lint
npm run build
```

Ejecutar suites de DB secuencialmente en desarrollo. La suite local comprueba flag/production, ausencia de RPC, propietario, aislamiento de intención real, vencimiento, rollback, concurrencia, PAID/acceso, auditoría, comisiones y ledger TEST, y rechazo de retiro después de desactivar el flag.
