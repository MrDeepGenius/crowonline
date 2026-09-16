import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { updateProductAction } from "@/server/actions/creator-edit";
import { COVER_GRADIENTS, PRODUCT_CATEGORIES } from "@/lib/domain";

type Product = {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  priceUsdt: number;
  category: string;
  coverEmoji: string;
  coverGradient: string;
};

export function ProductBriefForm({ product }: { product: Product }) {
  return (
    <Card>
      <CardHeader
        title="Brief del producto"
        description="Edita y guarda. Los cambios se reflejan en el marketplace al publicar."
      />
      <form action={updateProductAction} className="space-y-4">
        <input type="hidden" name="productId" value={product.id} />

        <Field label="Título">
          <Input name="title" defaultValue={product.title} />
        </Field>

        <Field label="Descripción corta">
          <Input name="shortDescription" defaultValue={product.shortDescription} />
        </Field>

        <Field label="Descripción">
          <Textarea
            name="description"
            className="min-h-[140px]"
            defaultValue={product.description}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Precio (USDT)">
            <Input
              name="priceUsdt"
              type="number"
              min={0}
              defaultValue={product.priceUsdt}
            />
          </Field>
          <Field label="Categoría">
            <Input name="category" list="crow-cats" defaultValue={product.category} />
          </Field>
          <Field label="Emoji">
            <Input name="coverEmoji" maxLength={4} defaultValue={product.coverEmoji} />
          </Field>
          <Field label="Portada">
            <Select name="coverGradient" defaultValue={product.coverGradient}>
              {COVER_GRADIENTS.map((gradient) => (
                <option key={gradient} value={gradient}>
                  {gradient}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <datalist id="crow-cats">
          {PRODUCT_CATEGORIES.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>

        <Button type="submit">Guardar cambios</Button>
      </form>
    </Card>
  );
}