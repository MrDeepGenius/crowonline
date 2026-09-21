/**
 * Vuelca el modelo de datos de Prisma (campos exactos por modelo) a stdout.
 * Uso: npx tsx scripts/criminologia/dump-models.ts
 */
import { Prisma } from "@prisma/client";

for (const model of Prisma.dmmf.datamodel.models) {
  console.log(`MODEL ${model.name}`);
  for (const field of model.fields) {
    const type = `${field.type}${field.isList ? "[]" : ""}`;
    const attrs = [field.isId ? "@id" : "", field.isRequired ? "" : "?"].filter(Boolean).join("");
    console.log(`  ${field.name} ${type}${attrs ? " " + attrs : ""}`);
  }
}
