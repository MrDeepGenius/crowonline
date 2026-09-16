import { Badge } from "@/components/ui/badge";
import { SectionTitle } from "@/components/ui/card";

const PILLARS = [
  {
    icon: "✦",
    title: "Creator Studio con IA",
    tag: "IDEA → IA → PRODUCTO",
    description:
      "Escribe tu idea y recibe título, promesa, público, módulos, lecciones, ejercicios y estrategia comercial en un blueprint editable.",
    points: ["Blueprint en vivo", "Edición total de la estructura", "Quality check antes de publicar"],
  },
  {
    icon: "◈",
    title: "Marketplace premium",
    tag: "Cursos · Ebooks · PDF · Webs · Kits",
    description:
      "Publica tu producto con portada, preview, contenido, reviews y certificado. Todo el catálogo en una experiencia cuidada.",
    points: ["Búsqueda y filtros por categoría", "Preview gratuito de contenido", "Reviews verificadas"],
  },
  {
    icon: "",
    title: "Afiliados de 5 niveles",
    tag: "30% directo + L1-L5",
    description:
      "Genera tu enlace, captura clics y convierte ventas. Tu equipo se construye solo y tú ganas en cinco niveles de profundidad.",
    points: ["Enlace y tracking de clics", "Conversión en tiempo real", "Equipo y downline"],
  },
  {
    icon: "◉",
    title: "Wallet USDT",
    tag: "BEP-20 · retiros manuales",
    description:
      "Saldo disponible, pendiente y ganado total con historial completo. Solicita retiros desde 25 USDT con aprobación manual.",
    points: ["Comisiones acreditadas al vender", "Retiro diario 3% / mensual 2%", "Historial con referencia"],
  },
  {
    icon: "",
    title: "IA multi-proveedor",
    tag: "Groq · NVIDIA · Leonardo",
    description:
      "Arquitectura de providers: Groq como motor rápido, NVIDIA como alternativa y Leonardo para multimedia cuando está configurado.",
    points: ["Fallback automático", "Claves solo por ENV", "Modo demo siempre disponible"],
  },
];

export function LandingPillars() {
  return (
    <section id="plataforma" className="crow-container scroll-mt-24 py-20">
      <SectionTitle
        eyebrow="La plataforma"
        title="Cinco piezas que trabajan juntas"
        description="CROW no es un marketplace más: es el sistema completo que convierte creadores en negocios y afiliados en distribuidores."
      />

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {PILLARS.map((pillar, index) => (
          <article
            key={pillar.title}
            className="crow-card crow-card-hover flex flex-col p-6"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="flex items-start justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-crow-violet/25 bg-crow-violet/10 text-lg text-crow-glow">
                {pillar.icon}
              </span>
              <Badge tone="default">{pillar.tag}</Badge>
            </div>

            <h3 className="mt-5 text-[17px] font-semibold tracking-tight">
              {pillar.title}
            </h3>
            <p className="mt-2 flex-1 text-[13px] leading-relaxed text-crow-muted">
              {pillar.description}
            </p>

            <ul className="mt-5 space-y-2 border-t border-white/[0.06] pt-4">
              {pillar.points.map((point) => (
                <li key={point} className="flex items-center gap-2 text-[12.5px] text-crow-muted">
                  <span className="h-1 w-1 rounded-full bg-crow-violet" />
                  {point}
                </li>
              ))}
            </ul>
          </article>
        ))}

        <article className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-crow-violet/30 bg-gradient-to-br from-crow-violet/25 via-crow-violetDeep/20 to-transparent p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-crow-violet/30 blur-3xl" />
          <div>
            <h3 className="text-[17px] font-semibold tracking-tight">
              Flujo completo de publicación
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-white/75">
              Draft → Generate → Edit → Preview → Quality Check → Publish.
              Sin pasos innecesarios, sin duplicar productos.
            </p>
          </div>
          <ol className="mt-6 space-y-2.5">
            {["Draft", "Generate", "Edit", "Preview", "Quality Check", "Publish"].map(
              (step, index) => (
                <li key={step} className="flex items-center gap-3 text-[13px] text-white/90">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/25 bg-black/30 text-[11px]">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ),
            )}
          </ol>
        </article>
      </div>
    </section>
  );
}