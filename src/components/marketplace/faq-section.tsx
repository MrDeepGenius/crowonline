"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type FAQItem = {
  question: string;
  answer: string;
};

const DEFAULT_FAQ: FAQItem[] = [
  {
    question: "¿Cuánto tiempo tengo para completar el curso?",
    answer: "Acceso de por vida. Puedes avanzar a tu propio ritmo sin límites de tiempo.",
  },
  {
    question: "¿Qué pasa si no me satisface el contenido?",
    answer: "CROW no ofrece reembolsos automáticos. Consulta la política del creador antes de comprar. Todos los cursos incluyen preview gratuito para evaluar la calidad.",
  },
  {
    question: "¿El certificado es válido?",
    answer: "Sí. Al completar el 100% del curso recibes un certificado digital con código único verificable públicamente en crow.market/certificates/[serial]",
  },
  {
    question: "¿Puedo compartir mi acceso con otros?",
    answer: "No. El acceso es personal e intransferible. Cada usuario debe adquirir su propia licencia.",
  },
  {
    question: "¿Necesito software especial?",
    answer: "No. Todo funciona en el navegador web (Chrome, Firefox, Safari, Edge). No requiere instalación.",
  },
];

function FAQItemComponent({ item, isOpen, onToggle }: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mp-card rounded-xl border border-white/[0.06] bg-black/20 transition-all hover:border-white/[0.1]">
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 p-5 text-left"
      >
        <span className="text-[14.5px] font-medium">{item.question}</span>
        <ChevronDown
          className={cn(
            "mt-0.5 h-5 w-5 shrink-0 text-crow-muted transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div className="border-t border-white/[0.06] px-5 pb-5 pt-4">
          <p className="text-[13.5px] leading-relaxed text-crow-muted">
            {item.answer}
          </p>
        </div>
      )}
    </div>
  );
}

export function FAQSection({ items = DEFAULT_FAQ }: { items?: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="mt-10">
      <h2 className="text-[17px] font-semibold">Preguntas frecuentes</h2>
      <div className="mt-5 space-y-3">
        {items.map((item, index) => (
          <FAQItemComponent
            key={index}
            item={item}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </section>
  );
}
