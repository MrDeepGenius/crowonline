"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Textarea } from "@/components/ui/field";
import { blueprintStats, qualityCheck, type ProductBlueprint } from "@/lib/ai/blueprint";
import { patchStringList } from "@/lib/blueprint-edit";
import { cn } from "@/lib/utils";

export function QualityCard({ blueprint }: { blueprint: ProductBlueprint }) {
  const quality = qualityCheck(blueprint);
  const stats = blueprintStats(blueprint);

  return (
    <Card>
      <CardHeader
        title="Quality check"
        description="Validación de estructura, ejercicios y promesa"
        action={<Badge tone={quality.ready ? "success" : "warn"}>{quality.score}/100</Badge>}
      />

      <div className="mb-4 grid grid-cols-4 gap-3 text-center">
        {[
          { label: "Módulos", value: stats.modules },
          { label: "Lecciones", value: stats.lessons },
          { label: "Ejercicios", value: stats.exercises },
          { label: "Duración", value: `${Math.round(stats.durationMin / 60)}h` },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-white/[0.06] py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-crow-muted">
              {item.label}
            </p>
            <p className="mt-1 text-[15px] font-semibold">{item.value}</p>
          </div>
        ))}
      </div>

      <ul className="space-y-1.5">
        {quality.checks.map((check) => (
          <li
            key={check.label}
            className={cn(
              "flex items-center gap-2 text-[12px]",
              check.ok ? "text-crow-muted" : "text-crow-warn",
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full text-[9px]",
                check.ok
                  ? "bg-crow-success/15 text-crow-success"
                  : "bg-crow-warn/15 text-crow-warn",
              )}
            >
              {check.ok ? "✓" : "!"}
            </span>
            {check.label}
          </li>
        ))}
      </ul>

      {quality.blocking.length ? (
        <p className="mt-4 rounded-xl border border-crow-warn/30 bg-crow-warn/10 px-3 py-2 text-[11.5px] text-crow-warn">
          Para publicar conviene resolver primero:{" "}
          {quality.blocking.map((item) => item.label).join(", ")}.
        </p>
      ) : (
        <p className="mt-4 rounded-xl border border-crow-success/30 bg-crow-success/10 px-3 py-2 text-[11.5px] text-crow-success">
          El blueprint cumple los estándares de calidad de CROW y está listo para publicarse.
        </p>
      )}
    </Card>
  );
}

export function ListsCard({
  blueprint,
  onChange,
}: {
  blueprint: ProductBlueprint;
  onChange: (next: ProductBlueprint) => void;
}) {
  return (
    <Card className="space-y-4">
      <CardHeader title="Listas editables" description="Un elemento por línea" />
      <Field label="Qué incluye">
        <Textarea
          value={blueprint.includes.join("\n")}
          onChange={(event) => onChange(patchStringList(blueprint, "includes", event.target.value))}
        />
      </Field>
      <Field label="Recursos">
        <Textarea
          value={blueprint.resources.join("\n")}
          onChange={(event) => onChange(patchStringList(blueprint, "resources", event.target.value))}
        />
      </Field>
      <Field label="Estrategia comercial">
        <Textarea
          value={blueprint.commercialStrategy.join("\n")}
          onChange={(event) =>
            onChange(patchStringList(blueprint, "commercialStrategy", event.target.value))
          }
        />
      </Field>
      <Field label="Objetivos de aprendizaje">
        <Textarea
          value={blueprint.learningGoals.join("\n")}
          onChange={(event) =>
            onChange(patchStringList(blueprint, "learningGoals", event.target.value))
          }
        />
      </Field>
    </Card>
  );
}