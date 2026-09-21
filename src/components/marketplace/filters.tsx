"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Select } from "@/components/ui/field";
import { PRODUCT_CATEGORIES } from "@/lib/domain";
import { cn } from "@/lib/utils";

type Facet = { value: string; count: number };

export function MarketplaceFilters({
  categories,
  types,
  total,
}: {
  categories: Facet[];
  types: Facet[];
  total: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [query, setQuery] = useState(params.get("q") ?? "");
  const activeCategory = params.get("category") ?? "all";
  const activeType = params.get("type") ?? "all";
  const sort = params.get("sort") ?? "recent";

  const categoryOptions = Array.from(
    new Set([...PRODUCT_CATEGORIES, ...categories.map((item) => item.value)]),
  );

  function pushParams(next: Record<string, string | null>) {
    const search = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (!value || value === "all") search.delete(key);
      else search.set(key, value);
    });
    startTransition(() => {
      router.push(`/marketplace${search.toString() ? `?${search}` : ""}`);
    });
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if ((params.get("q") ?? "") !== query) {
        pushParams({ q: query || null });
      }
    }, 420);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-crow-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar cursos, ebooks, kits…"
            className="crow-input pl-10"
            aria-label="Buscar productos"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-3">
          <Select
            value={activeType}
            onChange={(event) => pushParams({ type: event.target.value })}
            aria-label="Filtrar por tipo"
            className="w-full sm:w-44 lg:w-48"
          >
            <option value="all">Todos los formatos</option>
            {types.map((item) => (
              <option key={item.value} value={item.value}>
                {item.value} ({item.count})
              </option>
            ))}
          </Select>

          <Select
            value={sort}
            onChange={(event) => pushParams({ sort: event.target.value })}
            aria-label="Ordenar"
            className="w-full sm:w-40 lg:w-44"
          >
            <option value="recent">Más recientes</option>
            <option value="sales">Más vendidos</option>
            <option value="rating">Mejor valorados</option>
            <option value="price-asc">Precio: menor</option>
            <option value="price-desc">Precio: mayor</option>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => pushParams({ category: null })}
          className={cn(
            "mp-chip rounded-full px-3.5 py-1.5 text-[12.5px]",
            activeCategory === "all" ? "mp-chip-active" : "text-crow-muted",
          )}
        >
          Todas ({total})
        </button>
        {categoryOptions.map((category) => {
          const facet = categories.find((item) => item.value === category);
          if (!facet) return null;
          return (
            <button
              key={category}
              type="button"
              onClick={() => pushParams({ category })}
              className={cn(
                "mp-chip rounded-full px-3.5 py-1.5 text-[12.5px]",
                activeCategory === category ? "mp-chip-active" : "text-crow-muted",
              )}
            >
              {category} ({facet.count})
            </button>
          );
        })}
        {pending ? (
          <span className="ml-1 text-[11.5px] text-crow-muted">actualizando…</span>
        ) : null}
      </div>
    </div>
  );
}