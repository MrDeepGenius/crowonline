"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Provider = { request(input: { method: string; params?: unknown[] }): Promise<unknown> };
export function TestnetPayment({ token, data, expiresAt, detected }: {
  token: string; data: string; expiresAt: string; detected: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), 10000);
    return () => clearInterval(timer);
  }, [router]);
  async function pay() {
    setBusy(true);
    try {
      if (new Date(expiresAt) <= new Date()) throw new Error("La orden ha vencido. No envíes fondos.");
      const provider = (window as unknown as { ethereum?: Provider }).ethereum;
      if (!provider) throw new Error("Abre el checkout con una wallet EVM de navegador.");
      if (await provider.request({ method: "eth_chainId" }) !== "0x61") {
        await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x61" }] });
      }
      if (await provider.request({ method: "eth_chainId" }) !== "0x61") throw new Error("Selecciona BSC Testnet (97).");
      const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
      // The user's wallet displays and signs the transfer. No keys reach CROW.
      const hash = await provider.request({ method: "eth_sendTransaction", params: [{
        from: accounts[0], to: token, value: "0x0", data,
      }] });
      setMessage(`TX enviada: ${String(hash)}. El monitor la detectará automáticamente. No vuelvas a pagar.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "La wallet no pudo enviar la TX.");
    } finally { setBusy(false); }
  }
  return <div className="space-y-3">
    <p className="text-sm text-crow-warn">SOLO TESTNET · token de prueba sin valor. Usa este botón: una transferencia manual sin referencia no se acredita automáticamente.</p>
    <Button type="button" disabled={detected || busy || message.startsWith("TX enviada")} onClick={pay}>Pagar con wallet · BSC Testnet</Button>
    <p className="break-all text-xs text-crow-muted" role="status">{message}</p>
  </div>;
}
