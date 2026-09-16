"use client";

import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import type { ProductBlueprint } from "@/lib/ai/blueprint";
import { patchBlueprint } from "@/lib/blueprint-edit";
import { COVER_GRADIENTS, PRODUCT_CATEGORIES, PRODUCT_TYPES } from "@/lib/domain";

export function BriefCard({
  blueprint,
  onChange,
}: {
  blueprint: ProductBlueprint;
  onChange: (next: ProductBlueprint) => void;
}) {
  return (
    <Card className="space-y-4">
      <CardHeader
        title="Brief comercial"
        description="Todo es editable: los cambios se aplican al guardar el borrador."
      />

      <Field label="Título">
        <Input
          value={blueprint.title}
          onChange={(event) => onChange(patchBlueprint(blueprint, { title: event.target.value }))}
        />
      </Field>

      <Field label="Descripción corta">
        <Input
          value={blueprint.shortDescription}
          onChange={(event) =>
            onChange(patchBlueprint(blueprint, { shortDescription: event.target.value }))
          }
        />
      </Field>

      <Field label="Descripción completa">
        <Textarea
          className="min-h-[130px]"
          value={blueprint.description}
          onChange={(event) =>
            onChange(patchBlueprint(blueprint, { description: event.target.value }))
          }
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Público objetivo">
          <Textarea
            className="min-h-[76px]"
            value={blueprint.audience}
            onChange={(event) =>
              onChange(patchBlueprint(blueprint, { audience: event.target.value }))
            }
          />
        </Field>
        <Field label="Promesa">
          <Textarea
            className="min-h-[76px]"
            value={blueprint.promise}
            onChange={(event) =>
              onChange(patchBlueprint(blueprint, { promise: event.target.value }))
            }
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Formato">
          <Select
            value={blueprint.productType}
            onChange={(event) =>
              onChange(
                patchBlueprint(blueprint, {
                  productType: event.target.value as ProductBlueprint["productType"],
                }),
              )
            }
          >
            {PRODUCT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Categoría">
          <Input
            value={blueprint.category}
            list="crow-categories"
            onChange={(event) =>
              onChange(patchBlueprint(blueprint, { category: event.target.value }))
            }
          />
          <datalist id="crow-categories">
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </Field>

        <Field label="Precio (USDT)">
          <Input
            type="number"
            min={0}
            value={blueprint.recommendedPriceUsdt}
            onChange={(event) =>
              onChange(
                patchBlueprint(blueprint, {
                  recommendedPriceUsdt: Number(event.target.value) || 0,
                }),
              )
            }
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Emoji">
            <Input
              value={blueprint.coverEmoji}
              maxLength={4}
              onChange={(event) =>
                onChange(patchBlueprint(blueprint, { coverEmoji: event.target.value }))
              }
            />
          </Field>
          <Field label="Portada">
            <Select
              value={blueprint.coverGradient}
              onChange={(event) =>
                onChange(patchBlueprint(blueprint, { coverGradient: event.target.value }))
              }
            >
              {COVER_GRADIENTS.map((gradient) => (
                <option key={gradient} value={gradient}>
                  {gradient}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>
    </Card>
  );
}