import { CheckCircle2 } from "lucide-react";

export function LearningGoals({ goals }: { goals: string[] }) {
  if (!goals || goals.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-[17px] font-semibold">¿Qué aprenderás?</h2>
      <ul className="mt-4 space-y-3">
        {goals.map((goal, index) => (
          <li key={index} className="flex items-start gap-3 text-[14px] leading-relaxed">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-crow-success" />
            <span>{goal}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
