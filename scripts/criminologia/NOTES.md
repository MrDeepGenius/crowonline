# PLAN CURSO "INTRODUCCIÓN A LA CRIMINOLOGÍA" — CONTRATO Y ESTADO

> ARCHIVO BLINDADO ANTI-COMPACCIÓN. Leer primero si se retoma la tarea.

## Objetivo
Materializar el curso REAL (no mockup) "Introducción a la Criminología" — 9 módulos,
lecciones con contenido educativo completo, ejercicios, quiz final, imágenes Leonardo,
video si está disponible — en la DB local usando el MISMO pipeline de Creator Studio.
Después: test de verificación, tsc --noEmit, 1 commit, DETENERSE.

## NO TOCAR
Comisiones, wallet, checkout, afiliados, autenticación, blockchain, marketplace visual,
landing. No crear DB paralela.

## Contrato confirmado (verificado en código)
- Escritura: `src/server/services/product-writes.ts`
  - `createProductFromBlueprint(userId, blueprint)` → crea Product+Course+Module+Lesson+Exercise
  - `publishProductRecord(productId)` → publica el producto
- Blueprint plano (`src/lib/ai/types.ts` → `ProductBlueprint`):
  { title, subtitle, description, category, level, durationMin, priceUsdt,
    learningObjectives: string[], targetAudience: string,
    modules: [{ title, summary, lessons: [{ title, durationMin, content,
      exercises: [{ title, instructions, kind: "PRACTICE"|"QUIZ"|"PROJECT" }] }] }] }
- `content` = TEXTO PLANO; el player separa párrafos por `\n\n`.
- `Lesson` tiene: `imagePrompt`, `imageUrl`, `videoUrl` (opcional, setear tras generar).
- Leonardo: `src/lib/ai/providers/leonardo.ts` → `generateImage(...)` (LEONARDO_API_KEY en .env).
- Progreso: `src/server/services/learning.ts` → `enrollUser`, `toggleLessonComplete`;
  certificado se emite al 100% de lecciones completadas.

## Módulos (los 9, fijos)
1. Fundamentos de la criminología
2. Historia y evolución del pensamiento criminológico
3. El delito y sus principales conceptos
4. Teorías criminológicas
5. Factores sociales, psicológicos y ambientales
6. Victimología
7. Criminología, prevención y control del delito
8. Investigación criminológica y análisis de casos
9. Aplicación práctica y evaluación final

## Calidad exigida
Sin placeholders/Lorem/TODO; contenido real progresivo; ejercicios distintos por módulo
(comprensión, V/F, selección, mini-casos didácticos, reflexión); casos reales solo si son
documentados y diferenciados de ejemplos didácticos; portada + imágenes por módulo
(imagePrompt único por módulo); video solo si Leonardo lo genera, nunca inventado.

## Pasos restantes
1. ✅→ escribir scripts/criminologia/course-meta.ts (metadatos + quiz final)
2. → escribir scripts/criminologia/m1.ts … m9.ts (contenido real)
3. → escribir scripts/materialize-criminologia.ts (usa createProductFromBlueprint +
   publishProductRecord + Leonardo por módulo; setear Lesson.imageUrl por módulo)
4. → ejecutar materializador (creator demo: creator@crow.market)
5. → scripts/verify-criminologia.ts (9 módulos, contenido completo, cero placeholders,
   imágenes vinculadas, player renderizable)
6. → npx tsc --noEmit
7. → 1 commit: "feat(course): materializar curso real Introducción a la Criminología"

# PLAN CERRADO — CURSO "INTRODUCCIÓN A LA CRIMINOLOGÍA" (NO re-explorar)

## Contrato CONFIRMADO en código fuente (NO volver a leer)
- `createProductFromBlueprint({creatorId, blueprint, blueprintId?, status?})` en
  `src/server/services/product-writes.ts` → crea Product+Course+Modules+Lessons+Exercises.
- `publishProductRecord({productId, actorId})` mismo archivo → publica (PUBLISHED + Publication).
- Blueprint usa EXACTAMENTE estos campos (vistos en product-writes.ts L36-91):
  title, shortDescription, description, productType ("COURSE"), category,
  recommendedPriceUsdt, coverEmoji, coverGradient, tags[], includes[],
  learningGoals[], modules[]: { title, summary, lessons[]: { title, content,
  durationMin, imagePrompt?, videoUrl?, isFreePreview, exercises[]: { title, instructions, kind } } }
- qualityCheck/blueprintStats de `@/lib/ai/blueprint` se aplican solos (score informativo).
- Leonardo: `LeonardoProvider.generateImage(prompt)` → { url, kind:"IMAGE" }; tolerante a fallos.
- Progreso/certificado: `src/server/services/learning.ts` (toggleLessonComplete; certificado al 100%).
- Player: `/learn/[slug]`; preview: `/creator/studio`; producto: `/marketplace/[slug]`.

## Pasos restantes (SOLO escritura + ejecución)
1. Escribir `scripts/criminologia/meta.ts` + `m1..m9.ts` + `index.ts` (contenido real ES).
2. Escribir `scripts/materialize-criminologia.ts`: busca creator demo (creator@crow.market),
   arma ProductBlueprint completo, createProductFromBlueprint → publishProductRecord,
   luego intenta imagen de portada + 1 imagen por módulo con Leonardo (best-effort),
   guarda urls en Product.imageUrl / Lesson.imageUrl si existen campos.
3. Escribir `scripts/test-criminologia.ts` (quality check: 9 módulos, contenido, ejercicios,
   quiz final, sin TODO/Lorem/placeholder, PUBLISHED).
4. Ejecutar: npm run typecheck → tsx materialize → tsx test-criminologia → npx tsc --noEmit.
5. UN commit: "feat(course): materialize real criminology intro course (9 modules)".
6. DETENERSE. No hacer el segundo curso.

## Contenido: español, introductorio→progresivo, ejemplos didácticos ≠ hechos reales documentados.
## NO tocar: comisiones, wallet, checkout, afiliados, auth, blockchain, marketplace visual, landing.
