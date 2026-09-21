import type { CourseMeta, ExerciseSpec } from "./course-types";

export const COURSE_META: CourseMeta = {
  title: "Introducción a la Criminología",
  subtitle: "Fundamentos, teorías y análisis aplicado del delito",
  description:
    "Curso completo de iniciación a la criminología: qué estudia la disciplina, cómo se mide el delito, qué teorías explican la conducta criminal, quién es la víctima y cómo se previene el delito. Nueve módulos progresivos con casos didácticos, ejercicios por módulo y una evaluación final integradora. Diseñado para partir desde cero y llegar a una comprensión sólida y aplicada.",
  category: "Educación",
  priceUsdt: 49,
  level: "BEGINNER",
  durationMinutes: 540,
  objectives: [
    "Comprender el objeto de estudio de la criminología y su relación con el derecho penal y la criminalística.",
    "Interpretar datos delictivos reconociendo la cifra negra y sus sesgos.",
    "Explicar las principales teorías criminológicas y sus aplicaciones actuales.",
    "Analizar factores sociales, psicológicos y ambientales del delito.",
    "Aplicar conceptos de victimología a situaciones concretas de prevención.",
    "Elaborar un análisis criminológico básico de un caso con método propio.",
  ],
  audience:
    "Estudiantes de derecho, psicología, seguridad y trabajo social; personal de fuerzas de seguridad en formación; docentes; y cualquier persona interesada en entender el fenómeno delictivo con rigor, sin conocimientos previos.",
  coverImagePrompt:
    "Professional educational course cover, cinematic library and crime analysis desk, magnifying glass over crime statistics charts, dark navy and amber palette, modern flat-illustration style, no text, 16:9",
};

/**
 * Evaluación final del curso: 12 preguntas que cubren los 9 módulos.
 * Se adjunta a la última lección del módulo 9 como ejercicios QUIZ.
 */
export const FINAL_QUIZ: ExerciseSpec[] = [
  {
    title: "Evaluación final — Parte 1 (Módulos 1-3)",
    kind: "QUIZ",
    instructions: `Responde sin consultar el material. Si aciertas al menos 10 de 12 ítems, obtienes la aprobación del curso.

1) Verdadero o falso, justifica: "La criminología estudia la norma penal; el derecho penal estudia el delito como conducta real".
2) ¿Qué es la cifra negra y qué fuente de datos permite estimarla?
3) Ordena cronológicamente y asocia una idea central a cada escuela: Clásica, Positivista, Escuela de Chicago.
4) Define delito, delincuente y criminalidad. ¿En qué se diferencia "criminalidad" de "criminalización"?
5) Selección múltiple: la prevención situacional actúa sobre… a) la personalidad del delincuente b) las oportunidades del delito en un espacio concreto c) la estructura de clases d) la reincidencia poscondena.`,
  },
  {
    title: "Evaluación final — Parte 2 (Módulos 4-6)",
    kind: "QUIZ",
    instructions: `Continúa la evaluación final.

6) Explica la diferencia entre teorías del "hombre diferente" (positivismo biológico) y teorías del "entorno que empuja" (ecología social). Da un ejemplo didáctico de cada una.
7) ¿Qué aporta la teoría de las actividades cotidianas al análisis de un hurto en un barrio comercial?
8) Verdadero o falso, justifica: "La victimología estudia solo a la víctima perfecta".
9) ¿Qué es la revictimización y qué práctica institucional busca evitarla?
10) Anomía, aprender conducta y desorganización social: asocia cada concepto con su autor (Durkheim, Sutherland, Shaw y McKay) y con una intervención preventiva coherente.`,
  },
  {
    title: "Evaluación final — Parte 3 (Módulos 7-9) + Caso integrador",
    kind: "PROJECT",
    instructions: `Cierra la evaluación con un análisis integrador.

11) Diseña un plan breve de prevención del hurto de bicicletas en una ciudad media usando TRES niveles: situacional (CPTED), comunitario y social. Justifica cada nivel con una teoría vista en el curso.
12) CASO INTEGRADOR: te entregan los datos de un barrio (aumento de hurtos, alta rotación poblacional, iluminación deficiente, jóvenes desescolarizados, encuesta de victimización con 70% de no denuncia). Elabora un análisis criminológico de una página: hipótesis explicativas (mínimo dos, de distinto enfoque teórico), qué datos adicionales pedirías, y una propuesta de intervención con indicadores de resultado.

Autoevalúa: cobertura de los 9 módulos, uso correcto de la terminología, distinción entre hechos documentados y ejemplos didácticos.`,
  },
];

import type { CourseHeader } from "./types";

export const courseHeader: CourseHeader = {
  title: "Introducción a la Criminología",
  subtitle: "Cómo se estudia el delito: fundamentos, teorías y aplicación práctica",
  description:
    "Un recorrido completo por la ciencia que estudia el delito: qué es la criminología, cómo nació, qué explica hoy y cómo se aplica en la vida real. " +
    "Desde la diferencia entre delito y delincuencia hasta las teorías que dominan la investigación actual —escuelas clásicas y positivistas, teorías sociológicas, " +
    "psicológicas y de elección racional—, pasando por la victimología, la cifra negra, la prevención basada en evidencia y el análisis de casos.\n\n" +
    "El curso está diseñado para empezar desde cero: cada módulo explica los conceptos con ejemplos didácticos, distingue con claridad los casos reales documentados " +
    "de los ejemplos de estudio, e incluye ejercicios de comprensión, verdadero/falso, selección múltiple, análisis de mini casos y actividades de reflexión. " +
    "Al terminar, una evaluación final comprueba tu dominio del curso completo y te habilita para el certificado de CROW MARKET.\n\n" +
    "9 módulos · 29 lecciones · ejercicios por módulo · quiz final · certificado verificable.",
  objectives: [
    "Definir qué es la criminología y distinguirla del derecho penal y de la criminalística.",
    "Reconocer los hitos históricos del pensamiento criminológico: escuela clásica, escuela positivista y enfoques del siglo XX.",
    "Explicar los conceptos centrales: delito, delincuencia, conducta antisocial, cifra negra y tasa de delincuencia.",
    "Comparar las principales teorías criminológicas y las implicaciones prácticas de cada una.",
    "Analizar los factores sociales, psicológicos y ambientales asociados al delito.",
    "Comprender el papel de la víctima: conceptos básicos de victimología y su relación con el delito.",
    "Aplicar herramientas básicas de prevención situacional y análisis de casos con criterios de evidencia.",
    "Evaluar críticamente una explicación sobre el delito antes de aceptarla o compartirla.",
  ],
  audience:
    "Estudiantes y profesionales de derecho, seguridad, psicología, sociología, trabajo social y periodismo; personal de fuerzas y cuerpos de seguridad en formación; docentes; y cualquier persona interesada en entender el delito más allá de los titulares.",
  audienceNote:
    "No se requieren conocimientos previos: el curso parte de cero y aumenta la dificultad de forma gradual módulo a módulo.",
  level: "Principiante",
  hours: 12,
  priceUsdt: 29,
};
