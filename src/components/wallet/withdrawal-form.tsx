"use client";

import { useActionState, useState } from "react";

import { ErrorBox, SuccessBox } from "@/components/auth/auth-fields";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { requestWithdrawalAction } from "@/server/actions/wallet";
import { initialActionState } from "@/lib/validation";
import { cn, formatUsdt } from "@/lib/utils";

export function WithdrawalForm({
  available,
  minWithdrawal,
  monthlyEligible,
  lastAddress,
}: {
  available: number;
  minWithdrawal: number;
  monthlyEligible: boolean;
  lastAddress?: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    requestWithdrawalAction,
    initialActionState,
  );
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"DAILY" | "MONTHLY">("DAILY");

  const numericAmount = Number(amount) || 0;
  const feeRate = mode === "MONTHLY" ? 0.02 : 0.03;
  const fee = Math.round(numericAmount * feeRate * 1e6) / 1e6;
  const net = Math.round((numericAmount - fee) * 1e6) / 1e6;

  return (
    <Card>
      <CardHeader
        title="Solicitar retiro"
        description={`Disponible: ${formatUsdt(available)} · mínimo ${formatUsdt(minWithdrawal)}`}
      />

      <form action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tipo de retiro">
            <Select
              name="mode"
              value={mode}
              onChange={(event) => setMode(event.target.value as "DAILY" | "MONTHLY")}
            >
              <option value="DAILY">Diario · fee 3%</option>
              <option value="MONTHLY" disabled={!monthlyEligible}>
                Mensual · fee 2% {monthlyEligible ? "" : "(no disponible aún)"}
              </option>
            </Select>
          </Field>

          <Field label="Monto (USDT)">
            <Input
              name="amountUsdt"
              type="number"
              min={minWithdrawal}
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder={String(minWithdrawal)}
              required
            />
          </Field>
        </div>

        <Field
          label="Dirección USDT BEP-20"
          hint="Verifica la dirección: los envíos en blockchain son irreversibles."
        >
          <Input
            name="address"
            defaultValue={lastAddress ?? ""}
            placeholder="0x…"
            required
            minLength={10}
          />
        </Field>

        <Field label="Nota (opcional)">
          <Input name="note" placeholder="Referencia interna o comentario" />
        </Field>

        <input type="hidden" name="method" value="USDT_BEP20" />

        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 text-[12px]">
          <div className="flex items-center justify-between">
            <span className="text-crow-muted">Monto</span>
            <span className="text-crow-text">{formatUsdt(numericAmount)}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-crow-muted">
              Fee ({(feeRate * 100).toFixed(0)}%)
            </span>
            <span className="text-crow-danger">−{formatUsdt(fee)}</span>
          </div>
          <div className="mt-2 border-t border-white/[0.07] pt-2 flex items-center justify-between">
            <span className="text-crow-muted">Recibirás</span>
            <span className="text-[14px] font-semibold text-crow-success">
              {formatUsdt(net > 0 ? net : 0)}
            </span>
          </div>
        </div>

        <ErrorBox message={state.ok ? undefined : state.message} />
        <SuccessBox message={state.ok ? state.message : undefined} />

        <Button type="submit" disabled={pending} className={cn("w-full")}>
          {pending ? "Enviando solicitud…" : "Solicitar retiro"}
        </Button>
      </form>
    </Card>
  );
}