import type { BlueprintSpec } from "../../lib/ai/spec";

/**
 * Curso completo: Introducción a la Criminalística
 * Contenido educativo real para principiantes
 */
export const criminalisticaSpec: BlueprintSpec = {
  keywords: ["criminalística", "forense", "investigación", "criminal", "evidencia", "pericial"],
  title: "Introducción a la Criminalística: Ciencia de la Investigación Criminal",
  short: "Fundamentos de criminalística desde la escena del hecho hasta el informe pericial.",
  description:
    "Curso completo que introduce los principios, métodos y técnicas de la criminalística moderna.\n\nDesde la preservación de la escena del hecho hasta la elaboración del dictamen pericial, el alumno aprende a identificar, documentar y analizar evidencia física con rigor científico.\n\nIncluye casos prácticos, ejercicios de observación, quizzes interactivos y recursos descargables para aplicar inmediatamente los conceptos en escenarios reales.",
  audience:
    "Estudiantes de criminalística, derecho, investigación privada, personal de seguridad y cualquier persona interesada en la ciencia forense.",
  promise:
    "Comprender los fundamentos científicos de la investigación criminal y aplicar técnicas básicas de análisis de evidencia.",
  type: "COURSE",
  category: "Cursos",
  price: 69,
  includes: [
    "8 módulos con 24+ lecciones progresivas",
    "Quizzes interactivos con feedback inmediato",
    "Casos prácticos y ejercicios de análisis",
    "Recursos descargables (checklists, guías, glosario)",
    "Certificado digital de finalización",
  ],
  resources: [
    "Guía de preservación de escena del hecho",
    "Checklist de cadena de custodia",
    "Plantilla de informe pericial",
    "Glosario de términos forenses",
    "Cuestionario de repaso final",
    "Caso práctico integrador",
  ],
  strategy: [
    "Lanzamiento a 69 USDT con descuento del 40% primeros 14 días",
    "Primer módulo gratuito como preview",
    "Comisión 30% directa + residuales L1-L5",
  ],
  checklist: [
    "Contenido aprobado por estándares educativos",
    "Ejercicios con soluciones detalladas",
    "No incluye información para cometer delitos",
    "Enfoque en ética profesional",
  ],
  goals: [
    "Comprender los principios fundamentales de la criminalística",
    "Identificar y preservar evidencia física correctamente",
    "Documentar la escena del hecho según protocolo",
    "Interpretar informes periciales básicos",
    "Aplicar ética profesional en investigación criminal",
  ],
  tags: ["criminalística", "forense", "investigación", "ciencia", "evidencia"],
  emoji: "🔬",
  gradient: "slate",
  modules: [
    [
      "Fundamentos de la Criminalística",
      "Concepto, historia, principios y campos de aplicación de la ciencia forense.",
      [
        [
          "¿Qué es la Criminalística?",
          `# ¿Qué es la Criminalística?

La **criminalística** es la ciencia que estudia el delito desde el punto de vista físico, mediante la aplicación de métodos científicos para descubrir, documentar e interpretar la evidencia material relacionada con un hecho criminal.

## Definición Científica

Según Edmond Locard, pionero de la criminalística moderna:

> "Todo contacto deja un rastro"

Este principio fundamental establece que el autor de un delito siempre deja vestigios en la escena y se lleva consigo partículas del lugar.

## Objetivos de la Criminalística

1. **Investigar técnicamente** los hechos presuntamente delictivos
2. **Identificar** a los autores mediante evidencia física
3. **Aportar pruebas** científicas para el proceso judicial
4. **Reconstruir** la dinámica del hecho criminal

## Diferencia con Criminología

| Criminalística | Criminología |
|----------------|--------------|
| Estudia **cómo** ocurrió el delito | Estudia **por qué** ocurre el delito |
| Analiza evidencia física | Analiza causas sociales y psicológicas |
| Ciencia aplicada | Ciencia social |
| Orientada a la investigación | Orientada a la prevención |

## Campos de Aplicación

- Escena del hecho
- Laboratorio forense
- Identificación de personas
- Documentología
- Balística
- Toxicología
- Genética forense
- Informática forense`,
          `**Ejercicio de Reflexión**

Imagina la siguiente situación:

Un comercio fue asaltado durante la noche. Los delincuentes forzaron la puerta trasera y se llevaron dinero de la caja registradora. No hay testigos presenciales.

**Preguntas:**

1. ¿Qué evidencia física podría haber dejado el autor en la escena?
2. ¿Qué evidencia del lugar pudo llevarse consigo sin darse cuenta?
3. ¿Por qué es importante el Principio de Intercambio de Locard en este caso?

**Respuestas sugeridas:**

1. Huellas dactilares en la puerta o caja, marcas de herramientas en la cerradura, fibras de ropa, calzado, sudor, saliva, cabellos.

2. Fragmentos de pintura de la puerta, polvo del piso, microfibras del lugar, tierra del exterior adherida a su calzado.

3. Porque permite establecer que el autor estuvo físicamente en el lugar, aunque no haya testigos. La evidencia traza conecta al sospechoso con la escena del delito.`,
          true,
          [
            {
              title: "Quiz: Principios Fundamentales",
              instructions: "Selecciona la respuesta correcta:",
              options: [
                "La criminalística estudia las causas sociales del delito",
                "Todo contacto deja un rastro es el principio de intercambio",
                "La criminología analiza evidencia física en laboratorio",
                "La criminalística es una ciencia social preventiva",
              ],
              correctAnswer: "Todo contacto deja un rastro es el principio de intercambio",
              explanation:
                "El Principio de Intercambio de Locard establece que todo contacto entre dos superficies deja un rastro material. Es el fundamento de la investigación criminalística moderna.",
            },
          ],
          "Escena de laboratorio forense con microscopio, evidencias etiquetadas y técnico analizando muestras",
        ],
        [
          "Historia y Evolución",
          `# Historia de la Criminalística

## Orígenes (Siglo XIX)

### Alphonse Bertillon (1853-1914)
Creó el primer sistema de **identificación antropométrica** basado en medidas corporales (bertillonaje). Aunque fue reemplazado por las huellas dactilares, sentó las bases de la identificación científica.

### Francis Galton (1822-1911)
Demostró científicamente que las **huellas dactilares son únicas e invariables**. Desarrolló el primer sistema de clasificación dactiloscópica.

### Juan Vucetich (1858-1925)
Policía argentino que perfeccionó el sistema dactiloscópico y logró la **primera identificación criminal mediante huellas** en el caso de Francisca Rojas (1892).

## Era Moderna (Siglo XX)

### Edmond Locard (1877-1966)
Fundó el primer laboratorio policial científico en Lyon, Francia (1910). Formuló el **Principio de Intercambio**, piedra angular de la criminalística.

### Avances Tecnológicos

- **1901**: Primeros bancos de huellas dactilares
- **1910**: Primer laboratorio criminalístico oficial
- **1923**: Detección de sangre mediante pruebas químicas
- **1935**: Balística comparativa científica
- **1984**: Primera identificación por ADN (Alec Jeffreys)
- **1986**: Primer caso judicial resuelto con ADN
- **1990s**: Bases de datos genéticos nacionales
- **2000s**: Análisis digital forense y biometría avanzada

## Criminalística Actual

Hoy integra:
- Genética molecular
- Análisis de trazas microscópicas
- Informática forense
- Inteligencia artificial para reconocimiento de patrones
- Simulación 3D de escenas`,
          `**Línea de Tiempo Interactiva**

Ordena cronológicamente estos hitos de la criminalística:

A) Primera identificación por ADN en un caso criminal
B) Sistema de identificación antropométrica de Bertillon
C) Principio de Intercambio de Locard
D) Primera identificación por huellas dactilares (caso Rojas)

**Orden correcto:** B (1880s) → D (1892) → C (1910) → A (1986)

**Investiga:**
¿Qué otros avances criminalísticos ocurrieron en tu país? Busca al menos un caso histórico relevante de tu región.`,
          false,
          [
            {
              title: "Quiz: Pioneros de la Criminalística",
              instructions: "¿Quién realizó cada aporte?",
              options: [
                "Bertillon - huellas dactilares, Vucetich - antropometría, Locard - ADN",
                "Bertillon - antropometría, Vucetich - huellas dactilares, Locard - intercambio",
                "Galton - intercambio, Locard - huellas, Bertillon - balística",
                "Vucetich - antropometría, Galton - toxicología, Locard - documentos",
              ],
              correctAnswer:
                "Bertillon - antropometría, Vucetich - huellas dactilares, Locard - intercambio",
              explanation:
                "Bertillon desarrolló la antropometría (medidas corporales), Vucetich perfeccionó el sistema dactiloscópico, y Locard formuló el Principio de Intercambio (todo contacto deja rastro).",
            },
          ],
        ],
        [
          "Principios Criminalísticos Fundamentales",
          `# Los Siete Principios de la Criminalística

## 1. Principio de Intercambio (Locard)
**"Todo contacto deja un rastro"**

Al interactuar con la escena, el autor:
- Deja elementos propios (huellas, fluidos, fibras, ADN)
- Se lleva elementos del lugar (tierra, fragmentos, polen)

## 2. Principio de Uso
Los agentes físicos, químicos o biológicos **siempre dejan impresiones** en los objetos que los producen o participan en el hecho.

Ejemplo: Una bala conserva las estrías del cañón del arma.

## 3. Principio de Producción
El autor **siempre produce evidencia** al cometer el delito, consciente o inconscientemente.

## 4. Principio de Correspondencia
La evidencia encontrada en la escena debe **corresponder** con la evidencia encontrada en el sospechoso y viceversa.

## 5. Principio de Reconstrucción
A partir del estudio de evidencias es posible **reconstruir el mecanismo** del hecho.

## 6. Principio de Probabilidad
La repetición de características específicas permite **reducir la posibilidad de error** en la identificación.

## 7. Principio de Certeza
Las técnicas criminalísticas buscan **certeza científica**, no meras suposiciones.

## Aplicación Práctica

**Caso Ejemplo:**

Un vehículo atropelló a un peatón y se dio a la fuga. En la escena se encuentra:
- Fragmentos de pintura del vehículo
- Vidrios de faro delantero
- Marca de neumático

**Análisis:**
- **Intercambio**: El vehículo dejó fragmentos; posiblemente llevó fibras de la ropa de la víctima
- **Uso**: El impacto produjo la rotura del faro
- **Correspondencia**: Los fragmentos deben coincidir con el vehículo sospechoso
- **Reconstrucción**: Es posible determinar velocidad, ángulo de impacto y trayectoria
- **Certeza**: El análisis químico de pintura permite identificar marca y modelo`,
          `**Caso de Análisis**

**Situación:**
Robo en una vivienda. Se forzó una ventana. Dentro se encuentra:
- Gotas de sangre en el marco de la ventana
- Huella de calzado en el jardín
- Herramientas abandonadas en el patio

**Preguntas:**

1. ¿Qué principios criminalísticos se aplican aquí?
2. ¿Qué evidencia permitiría conectar un sospechoso con la escena?
3. ¿Cómo se podría reconstruir la secuencia del hecho?

**Respuesta:**

1. **Intercambio** (sangre del autor, posible tierra en su ropa), **Producción** (el autor generó evidencia al forzar la ventana), **Correspondencia** (herramientas y calzado deben coincidir con posesión del sospechoso).

2. Análisis de ADN en sangre, comparación de calzado, identificación de herramientas (marcas de fabricante, desgaste único).

3. Entrada por ventana (daño en marco), lesión del autor (sangre), desplazamiento por jardín (huellas), abandono de herramientas al huir (posible alarma o interrupción).`,
          false,
          [
            {
              title: "Quiz: Aplicación de Principios",
              instructions: "En un incendio intencional, se encuentra un envase de combustible con huellas dactilares. ¿Qué principio permite vincular al sospechoso?",
              options: [
                "Principio de Reconstrucción",
                "Principio de Correspondencia",
                "Principio de Producción",
                "Principio de Probabilidad",
              ],
              correctAnswer: "Principio de Correspondencia",
              explanation:
                "El Principio de Correspondencia establece que la evidencia del lugar (huellas en el envase) debe corresponder con la del sospechoso (sus huellas dactilares). Permite establecer el vínculo físico entre persona y objeto.",
            },
          ],
        ],
      ],
    ],
    [
      "La Escena del Hecho",
      "Protección, observación, fijación y documentación de la escena criminal.",
      [
        [
          "Protección y Preservación",
          `# Protección de la Escena del Hecho

La escena del hecho es el **lugar donde ocurrió el evento criminal** y contiene la evidencia física más valiosa de la investigación.

## Primera Respuesta

### Prioridades en Orden:
1. **Seguridad** (proteger vidas)
2. **Atención médica** (asistir heridos)
3. **Protección de la escena** (evitar contaminación)
4. **Documentación inicial** (observaciones del primer respondiente)

## Acordonamiento

**Perímetro Interior:**
- Área inmediata del hecho
- Acceso solo personal autorizado
- Mayor control y restricción

**Perímetro Exterior:**
- Área circundante
- Protege rutas de acceso/escape
- Control de curiosos y prensa

### Regla de Oro:
> **"Mejor acordonar de más que de menos"**

Siempre se puede reducir el perímetro, pero expandirlo después puede ser tarde.

## Contaminación de la Escena

### Tipos:
- **Primaria**: Por el propio delincuente
- **Secundaria**: Por víctima o testigos
- **Terciaria**: Por personal de respuesta (policía, médicos, bomberos)

### Prevención:
- Limitar el acceso
- Usar equipo de protección (guantes, cubrezapatos, gorro)
- Establecer un solo camino de acceso
- Registrar toda persona que ingresa
- No tocar, mover ni alterar nada innecesariamente

## Registro de Acceso

Toda escena debe tener **bitácora de acceso** con:
- Nombre y cargo
- Hora de entrada
- Hora de salida
- Motivo del ingreso`,
          `**Ejercicio Práctico**

**Escenario:**
Llegas primero a una vivienda donde reportan un robo. La puerta está abierta, hay desorden dentro, y no ves a nadie.

**Preguntas:**
1. ¿Cuáles son tus primeras 3 acciones en orden de prioridad?
2. ¿Dónde colocarías el perímetro de seguridad?
3. ¿Qué errores comunes debes evitar?

**Respuesta:**

1. **Verificar seguridad** (asegurar que no hay peligro inmediato), **No ingresar ni tocar nada**, **Acordonar la escena** desde afuera incluyendo la puerta de acceso.

2. Acordonar desde la calle/acceso principal, incluyendo camino hacia la puerta, la entrada y espacio perimetral de la vivienda. No permitir que nadie (ni vecinos ni propietario) ingrese hasta que llegue personal especializado.

3. **Errores comunes**: Ingresar sin protección, permitir que el propietario entre "solo a ver", tocar objetos, pisar huellas, permitir que curiosos se acerquen, no registrar quién entró.`,
          true,
          [
            {
              title: "Quiz: Protección de Escena",
              instructions: "¿Cuál es la prioridad correcta al llegar a una escena?",
              options: [
                "Documentar → Acordonar → Seguridad → Atención médica",
                "Seguridad → Atención médica → Protección → Documentación",
                "Acordonar → Documentar → Seguridad → Atención médica",
                "Atención médica → Documentar → Acordonar → Seguridad",
              ],
              correctAnswer: "Seguridad → Atención médica → Protección → Documentación",
              explanation:
                "La secuencia correcta siempre prioriza la vida: primero asegurar que no hay peligro, luego asistir heridos, después proteger la escena y finalmente documentar. Nunca se sacrifica una vida por preservar evidencia.",
            },
          ],
          "Escena del crimen acordonada con cinta amarilla, oficiales de policía protegiendo perímetro",
        ],
        [
          "Observación Metódica",
          `# Métodos de Observación de la Escena

## Métodos de Búsqueda

### 1. Espiral
- Desde el centro hacia afuera (o viceversa)
- Útil en escenas circulares o sin estructura clara
- Evita saltar áreas

### 2. Cuadrícula (Grid)
- División en cuadrantes numerados
- Búsqueda sistemática por secciones
- Ideal para áreas grandes
- Permite asignar sectores a diferentes técnicos

### 3. Franjas/Líneas Paralelas
- Búsqueda en líneas paralelas
- Requiere varios técnicos
- Efectivo en espacios abiertos grandes

### 4. Zona o Sectores
- División por ambientes o áreas funcionales
- Cada zona se procesa completa antes de pasar a la siguiente
- Común en viviendas o edificios

### 5. Punto a Punto (Link)
- Siguiendo rutas lógicas del autor
- Punto de entrada → objetivo → punto de salida
- Útil cuando hay ruta evidente

## Técnica de las 3 Miradas

**Primera Mirada - General:**
- Vista panorámica sin tocar nada
- Impresión general del lugar
- Identificar áreas críticas

**Segunda Mirada - Media:**
- Acercamiento a zonas de interés
- Relación entre evidencias
- Planificar orden de procesamiento

**Tercera Mirada - Detalle:**
- Inspección minuciosa
- Búsqueda de evidencias pequeñas (fibras, microrastros)
- Uso de lentes de aumento, luz forense

## Reglas de Observación

1. **Sistemática**: Nunca al azar
2. **Completa**: Toda el área, incluidos techos y rincones
3. **Paciente**: Sin apuros
4. **Documentada**: Fotografiar antes de tocar
5. **Repetible**: Otro técnico debe poder replicar el proceso`,
          `**Caso de Análisis**

**Situación:**
Homicidio en apartamento de 3 ambientes (sala, cocina, dormitorio). La víctima está en el dormitorio. Hay signos de forcejeo en la sala.

**Tarea:**
1. ¿Qué método de búsqueda usarías y por qué?
2. Describe el orden en que procesarías las áreas.
3. ¿Qué buscarías específicamente en cada ambiente?

**Respuesta Sugerida:**

1. **Método de Zonas/Sectores**, porque es un espacio cerrado con ambientes definidos. Cada ambiente se procesa completamente antes de pasar al siguiente.

2. **Orden:**
   - Ruta de acceso/salida (puerta principal)
   - Sala (signos de forcejeo = posible inicio del hecho)
   - Dormitorio (víctima = desenlace)
   - Cocina (posible arma improvisada o ruta secundaria)
   - Baño y otras áreas

3. **Búsqueda específica:**
   - **Puerta**: Huellas, signos de forzamiento, sangre
   - **Sala**: Objetos caídos, manchas, armas, huellas de lucha
   - **Dormitorio**: Posición del cuerpo, manchas, arma, desorden
   - **Cocina**: Cuchillos faltantes, toallas usadas para limpiar`,
          false,
          [
            {
              title: "Quiz: Métodos de Búsqueda",
              instructions: "¿Qué método es más apropiado para una escena en campo abierto de gran extensión?",
              options: [
                "Espiral desde el centro",
                "Zona por sectores",
                "Franjas paralelas con equipo",
                "Punto a punto siguiendo ruta",
              ],
              correctAnswer: "Franjas paralelas con equipo",
              explanation:
                "En áreas extensas abiertas (campo, terreno baldío), el método de franjas paralelas es más efectivo porque permite cubrir sistemáticamente toda el área con un equipo coordinado, evitando dejar espacios sin revisar.",
            },
          ],
        ],
        [
          "Fijación y Documentación",
          `# Documentación de la Escena

La documentación debe permitir **reconstruir la escena** sin haber estado presente.

## Fotografía Forense

### Regla de las 3 Distancias:

**1. Plano General (Vista General)**
- Contexto completo de la escena
- Ubicación del lugar
- Referencias del entorno

**2. Plano Medio (Vista de Conjunto)**
- Relación entre evidencias
- Distribución de elementos
- Múltiples ángulos

**3. Plano Detalle (Acercamiento)**
- Evidencia específica
- Siempre con testigo métrico
- Múltiples tomas por evidencia

### Técnica:
- Fotografiar **ANTES** de tocar cualquier cosa
- Incluir testigo métrico (regla, escala)
- Usar tarjetas numeradas para evidencias
- Tomar fotos con y sin escala
- Mínimo 2 ángulos por evidencia

## Planimetría (Croquis)

### Tipos:

**Croquis Simple:**
- A mano alzada
- Durante la inspección inicial
- Referencia rápida

**Plano a Escala:**
- Medidas exactas
- Elaborado posteriormente
- Base para informes y juicio

### Contenido Mínimo:
- Título y ubicación
- Fecha y hora
- Norte geográfico
- Escala utilizada
- Leyenda/referencias
- Evidencias numeradas
- Medidas (distancias, dimensiones)
- Nombre y firma del técnico

## Acta de Inspección

Documento escrito que describe:
- Fecha, hora, lugar
- Personal interviniente
- Condiciones climáticas
- Estado de la escena al llegar
- Descripción detallada
- Evidencias recolectadas
- Técnicas aplicadas
- Observaciones relevantes

## Video Forense

Complemento moderno que permite:
- Recorrido completo de la escena
- Relación espacial entre elementos
- Narración descriptiva simultánea
- Registro de condiciones no fotográficas (olores, temperatura)

**Importante:** El video **complementa** la fotografía, no la reemplaza.`,
          `**Ejercicio Práctico de Documentación**

**Tarea:**
Documenta tu propia habitación como si fuera una escena del hecho.

**Pasos:**
1. Toma 3 fotografías: general, media, detalle de un objeto
2. Dibuja un croquis simple a mano alzada con:
   - Paredes y puertas
   - Muebles principales
   - Ubicación de 5 objetos
   - Medida de al menos 2 distancias

3. Redacta un párrafo describiendo la escena como si la vieras por primera vez.

**Autoevaluación:**
- ¿La foto general muestra el contexto completo?
- ¿El croquis permite entender la distribución?
- ¿La descripción es objetiva (sin interpretaciones)?
- ¿Otro técnico podría ubicarse con tu documentación?`,
          false,
          [
            {
              title: "Quiz: Fotografía Forense",
              instructions: "Al fotografiar una huella de calzado en la escena, ¿qué es ESENCIAL incluir?",
              options: [
                "Testigo métrico junto a la huella",
                "Filtro de color para resaltar",
                "Marca de agua con fecha y hora",
                "Flash directo para mayor detalle",
              ],
              correctAnswer: "Testigo métrico junto a la huella",
              explanation:
                "El testigo métrico (regla o escala) es ESENCIAL para documentar el tamaño real de la evidencia. Permite comparaciones posteriores y análisis dimensional. Se fotografía primero sin escala (contexto) y luego con escala (detalle).",
            },
          ],
          "Fotógrafo forense documentando evidencia con cámara profesional, testigo métrico y tarjetas numeradas",
        ],
      ],
    ],
    [
      "Evidencia Física y Cadena de Custodia",
      "Recolección, embalaje, etiquetado y preservación de evidencia material.",
      [
        [
          "Tipos de Evidencia Física",
          `# Clasificación de la Evidencia

## Por su Naturaleza

### Evidencia Biológica:
- Sangre, semen, saliva
- Cabellos, pelos, uñas
- Tejidos, órganos
- Fluidos corporales
- **Valor:** Identificación por ADN

### Evidencia Física/Impresa:
- Huellas dactilares
- Huellas de calzado
- Marcas de neumáticos
- Marcas de herramientas
- **Valor:** Identificación, reconstrucción

### Evidencia Balística:
- Proyectiles
- Casquillos
- Armas de fuego
- Pólvora, residuos
- **Valor:** Identificación de arma, trayectoria

### Evidencia Documental:
- Documentos escritos
- Documentos falsificados
- Firmas
- Billetes
- **Valor:** Autoría, autenticidad

### Evidencia Química:
- Drogas, estupefacientes
- Venenos, tóxicos
- Acelerantes (incendios)
- Explosivos
- **Valor:** Identificación de sustancias

### Evidencia de Transferencia:
- Fibras textiles
- Vidrios
- Pinturas
- Tierra, polen
- **Valor:** Vinculación lugar-persona

## Por su Tamaño

**Macroscópica:** Visible a simple vista (arma, prenda)
**Microscópica:** Requiere instrumental (fibra, cabello)
**Traza:** Cantidades mínimas (ADN en objeto tocado)

## Por su Relación con el Hecho

**Directa:** Relacionada inmediatamente con el delito (arma homicida)
**Indirecta:** Aporta contexto pero no prueba el delito directamente (testigo que escuchó algo)
**Circunstancial:** Conjunto de indicios que forman evidencia (rastro de pasos hacia y desde la escena)`,
          `**Ejercicio de Clasificación**

En una escena de robo a mano armada se encuentran:

1. Casquillo de bala en el piso
2. Huella dactilar en la caja registradora
3. Gorro de lana abandonado con un cabello
4. Mancha de sangre en la pared
5. Fragmento de vidrio de la puerta rota

**Clasifica cada evidencia:**
- Por naturaleza (biológica, física, balística, etc.)
- Por tamaño (macro, micro, traza)
- Por relación (directa, indirecta, circunstancial)

**Respuesta:**

1. **Casquillo:** Balística / Macroscópica / Directa
2. **Huella dactilar:** Física-impresa / Macroscópica / Directa
3. **Cabello en gorro:** Biológica / Microscópica / Indirecta
4. **Mancha sangre:** Biológica / Macroscópica / Directa
5. **Vidrio:** Transferencia / Microscópica / Circunstancial`,
          true,
          [
            {
              title: "Quiz: Clasificación de Evidencia",
              instructions: "¿Qué tipo de evidencia permite identificación mediante ADN?",
              options: [
                "Evidencia balística",
                "Evidencia biológica",
                "Evidencia documental",
                "Evidencia de transferencia",
              ],
              correctAnswer: "Evidencia biológica",
              explanation:
                "La evidencia biológica (sangre, saliva, semen, cabellos, tejidos) contiene material genético que permite la identificación mediante análisis de ADN, proporcionando un altísimo grado de certeza en la identificación de personas.",
            },
          ],
          "Evidencias etiquetadas y embaladas en bolsas transparentes con códigos, laboratorio forense",
        ],
        [
          "Recolección y Embalaje",
          `# Técnicas de Recolección

## Principios Generales

1. **Documentar antes de recolectar** (foto, ubicación, croquis)
2. **Usar equipo de protección** (guantes, mascarilla, cubrezapatos)
3. **Evitar contaminación cruzada** (cambiar guantes entre evidencias)
4. **Preservar estado original** (no limpiar, no alterar)
5. **Embalar individualmente** (una evidencia por recipiente)
6. **Etiquetar inmediatamente** (antes de perder contexto)

## Técnicas por Tipo

### Fluidos Biológicos:

**Líquidos (sangre fresca):**
- Absorber con gasa estéril
- Dejar secar al aire (NUNCA calor directo)
- Embalar en papel (NUNCA plástico sellado)

**Secos (manchas):**
- Recolectar el objeto completo si es posible
- Si no: raspado cuidadoso o corte de la sección
- Embalar en papel

### Huellas Dactilares:

**Visibles:**
- Fotografiar con escala
- Levantar con cinta adhesiva especial
- Preservar en tarjeta transparente

**Latentes:**
- Revelar con polvos o reactivos químicos
- Levantar o fotografiar
- Si el objeto es transportable, llevar el objeto completo

### Armas de Fuego:

- NUNCA introducir objetos en el cañón
- Descargar solo si es absolutamente necesario (por seguridad)
- Documentar estado (cargada, seguro, etc.)
- Tomar por zonas sin huellas (guardas del gatillo con cordel)
- Embalar en caja rígida

### Fibras y Cabellos:

- Recolectar con pinzas de punta roma
- Evitar doblar o romper
- Embalar en papel doblado (papel farmacia)
- Proteger en contenedor rígido

### Evidencia Digital:

- NO encender dispositivos apagados
- NO apagar dispositivos encendidos
- Fotografiar pantalla si está activa
- Embalar en bolsa de Faraday (bloquea señales)
- Documentar cables y conexiones

## Material de Recolección

- Guantes descartables
- Pinzas
- Gasas estériles
- Hisopos
- Cajas de diferentes tamaños
- Sobres y bolsas de papel
- Recipientes rígidos
- Etiquetas
- Marcadores indelebles
- Cinta adhesiva especial
- Testigos métricos`,
          `**Caso Práctico**

**Escena:** Agresión sexual. Se debe recolectar:

A) Prenda de vestir con manchas de fluido
B) Cabello encontrado en la escena
C) Bebida con posible droga
D) Teléfono celular de la víctima

Para cada evidencia, describe:
1. Cómo la recolectarías
2. En qué la embalarías
3. Qué precauciones específicas tomarías

**Respuesta:**

**A) Prenda con fluido:**
- Dejar secar al aire en área limpia
- NO doblar la mancha sobre sí misma
- Embalar en bolsa de papel grande
- Etiquetar como "evidencia biológica - NO abrir sin equipo de protección"

**B) Cabello:**
- Levantar con pinzas desde el bulbo (raíz)
- Colocar en papel farmacia doblado
- Insertar en sobre de papel
- Marcar ubicación exacta donde se encontró

**C) Bebida:**
- Usar recipiente de vidrio estéril si está líquida
- Si está en su recipiente original, sellarlo
- Refrigerar (cadena de frío)
- Etiquetar "tóxico - análisis químico urgente"

**D) Teléfono:**
- Fotografiar pantalla si está encendido
- NO apagar ni desbloquear
- Embalar en bolsa de Faraday
- Documentar nivel de batería y conexiones
- Entregar a especialista en informática forense`,
          false,
          [
            {
              title: "Quiz: Embalaje Correcto",
              instructions: "¿Por qué la sangre húmeda NO debe embalarse en plástico sellado?",
              options: [
                "El plástico contamina la muestra con químicos",
                "La humedad favorece hongos y descomposición",
                "El plástico impide el análisis de ADN posterior",
                "La sangre se adhiere al plástico y se pierde",
              ],
              correctAnswer: "La humedad favorece hongos y descomposición",
              explanation:
                "Las evidencias biológicas húmedas embaladas en plástico sellado retienen humedad, lo que favorece el crecimiento de hongos y bacterias que degradan el ADN. Deben secarse al aire y embalarse en papel que permite respiración.",
            },
          ],
        ],
        [
          "Cadena de Custodia",
          `# Cadena de Custodia

Es el **registro documentado e ininterrumpido** de todas las personas que han tenido posesión de la evidencia desde su recolección hasta su presentación en juicio.

## Objetivo

Garantizar que la evidencia presentada en juicio es:
- **La misma** que se recolectó en la escena
- **Auténtica** (no ha sido alterada)
- **Confiable** (manejada apropiadamente)

## Elementos de la Cadena

1. **Recolección:** Quién, cuándo, dónde, cómo
2. **Transporte:** Quién trasladó, cuándo, a dónde
3. **Almacenamiento:** Dónde, bajo qué condiciones, quién custodia
4. **Análisis:** Quién analizó, cuándo, qué técnicas
5. **Presentación:** Quién presenta, ante qué autoridad

## Información en Etiqueta

Cada evidencia debe tener etiqueta con:
- **Número único de caso**
- **Número de evidencia** (secuencial)
- **Descripción breve** del ítem
- **Fecha y hora** de recolección
- **Ubicación exacta** donde se encontró
- **Nombre y firma** del recolector
- **Fecha y firma** de cada transferencia posterior

## Formato de Registro

| Fecha/Hora | Recibido de | Entregado a | Propósito | Firma Entrega | Firma Recepción |
|------------|-------------|-------------|-----------|---------------|------------------|
| 15/09 10:30 | Escena | Técnico A | Recolección | - | J. Pérez |
| 15/09 12:00 | Técnico A | Laboratorio | Análisis | J. Pérez | M. López |
| 20/09 14:00 | Laboratorio | Fiscal | Resultado | M. López | R. García |

## Errores que Rompen la Cadena

- Falta de documentación de una transferencia
- Lapsos de tiempo sin custodia documentada
- Evidencia sin etiqueta o con etiqueta incompleta
- Alteración de etiquetas
- Almacenamiento inadecuado
- Acceso no autorizado
- Pérdida de evidencia

## Consecuencias

Si se rompe la cadena de custodia:
- La evidencia puede ser **inadmisible** en juicio
- Se cuestiona la **integridad** de la investigación
- Puede resultar en **absolución** del acusado
- Responsabilidad **disciplinaria o penal** del responsable

## Almacenamiento Seguro

- Área de acceso restringido
- Control biométrico o con clave
- Cámaras de seguridad
- Registro de accesos
- Condiciones apropiadas (temperatura, humedad)
- Separación por tipo y caso
- Inventario actualizado

## Principio de Mínimas Transferencias

**Regla:** Minimizar el número de personas que manejan la evidencia.

Cada transferencia es un punto de riesgo potencial.`,
          `**Ejercicio: Detectar Errores en Cadena de Custodia**

**Caso:**

Día 1, 10:00 - Oficial Martínez recolecta cuchillo en escena de homicidio. Lo embala en bolsa de papel marcada "Evidencia 001-A".

Día 1, 12:00 - Martínez entrega bolsa a Oficial Gómez para transporte.

Día 1, 15:00 - El cuchillo llega al laboratorio. Técnico Rodríguez lo recibe.

Día 5, 09:00 - Analista Silva examina el cuchillo y toma muestras.

Día 10 - El cuchillo es presentado en juicio por el Fiscal.

**Identifica los errores:**

**Respuesta:**

1. **No hay registro** de firma de Martínez al entregar a Gómez (Día 1, 12:00)
2. **No hay registro** de quién transportó desde Gómez hasta laboratorio
3. **No consta la firma** de Rodríguez al recibir (Día 1, 15:00)
4. **Falta documentación** de dónde y cómo se almacenó del Día 1 al Día 5
5. **No se registró** la firma de Silva al recibir para análisis (Día 5)
6. **No se documenta** quién custodiaba del Día 5 al Día 10
7. **No se registra** la transferencia del laboratorio al Fiscal para el juicio

**Todas estas fallas podrían hacer que la evidencia sea inadmisible.**`,
          false,
          [
            {
              title: "Quiz: Cadena de Custodia",
              instructions: "¿Cuál es la información MÁS crítica que debe tener toda etiqueta de evidencia?",
              options: [
                "El peso exacto del ítem recolectado",
                "Número único, descripción, fecha, ubicación, recolector",
                "El nombre del juez que llevará el caso",
                "La fotografía impresa de la evidencia",
              ],
              correctAnswer: "Número único, descripción, fecha, ubicación, recolector",
              explanation:
                "La etiqueta debe permitir identificar inequívocamente la evidencia (número único), saber qué es (descripción), cuándo y dónde se encontró (fecha/ubicación) y quién la recolectó (responsable). Sin estos datos, no se puede establecer cadena de custodia válida.",
            },
          ],
          "Técnico forense etiquetando evidencia con formulario de cadena de custodia, registro detallado",
        ],
      ],
    ],
    [
      "Identificación Humana y Lofoscopia",
      "Sistemas de identificación, huellas dactilares, palmares y plantares.",
      [
        [
          "Sistemas de Identificación",
          `# Identificación de Personas

## Métodos de Identificación

### 1. Dactiloscopia (Huellas Dactilares)

**Principios:**
- **Perennidad:** Permanecen desde el 6º mes de gestación hasta la descomposición cadavérica
- **Inmutabilidad:** No cambian durante toda la vida
- **Variedad:** No existen dos personas con huellas idénticas (ni gemelos)

**Clasificación de Vucetich:**
Basada en el núcleo del dactilograma:
- **A** - Arco
- **I** - Presilla interna
- **E** - Presilla externa  
- **V** - Verticilo

**Fórmula dactilar:**
Pulgar + 4 dedos restantes de cada mano
Ejemplo: A-2342 / E-1234

### 2. Identificación por ADN

- **Certeza:** 99.9999% en identificación
- **Material:** Sangre, saliva, semen, cabellos con bulbo, tejidos
- **Tiempo:** Días a semanas según complejidad
- **Costo:** Alto pero cada vez más accesible
- **Uso:** Identificación de víctimas, imputados, vínculos de parentesco

### 3. Odontología Forense

- **Piezas dentales** resistentes al fuego, agua, tiempo
- **Registros dentales** comparables (radiografías, tratamientos)
- **Útil en:** Cadáveres carbonizados, sumergidos, desastres masivos

### 4. Antropología Forense

En restos óseos permite determinar:
- Sexo
- Edad aproximada
- Estatura
- Ancestría
- Traumas y patologías
- Tiempo desde la muerte

### 5. Reconocimiento Facial

- **Testigos:** Menos confiable (memoria falible)
- **Biométrico:** Software de reconocimiento facial
- **Reconstrucción:** Desde cráneo en casos antiguos`,
          `**Ejercicio de Comparación**

**Situación:** Homicidio sin testigos. Cuerpo encontrado 3 semanas después en zona rural. Se requiere identificar a la víctima.

**Métodos disponibles:**
A) Dactiloscopia
B) ADN
C) Odontología
D) Antropología

**Preguntas:**
1. ¿Cuál método sería tu primera opción y por qué?
2. ¿Qué método NO sería viable si el cuerpo está muy descompuesto?
3. ¿Qué método usarías si no hay registros previos de la persona?

**Respuesta:**

1. **Dactiloscopia primero** si los pulpejos están preservados, porque es rápida y hay bases de datos nacionales. Si fallan las huellas por descomposición, **ADN** como segunda opción.

2. **Reconocimiento facial** por testigos no sería viable con descomposición avanzada.

3. **Antropología forense** para perfil biológico (sexo, edad, estatura) que permita correlacionar con reportes de personas desaparecidas. **ADN** si hay familiares que reporten desaparición para comparación.`,
          true,
          [
            {
              title: "Quiz: Principios de Identificación",
              instructions: "¿Cuál NO es un principio de las huellas dactilares?",
              options: [
                "Perennidad - permanecen toda la vida",
                "Inmutabilidad - no cambian",
                "Variedad - son únicas",
                "Heredabilidad - se transmiten a los hijos",
              ],
              correctAnswer: "Heredabilidad - se transmiten a los hijos",
              explanation:
                "Las huellas dactilares NO se heredan. Aunque hay patrones generales compartidos genéticamente, el diseño específico de cada huella es único y se forma por factores del desarrollo fetal, no por genes. Los tres principios reales son: perennidad, inmutabilidad y variidad.",
            },
          ],
          "Sistema AFIS comparando huellas dactilares digitalizadas en pantalla de computadora",
        ],
        [
          "Revelado de Huellas Latentes",
          `# Técnicas de Revelado

Las huellas **latentes** (invisibles) deben ser reveladas para poder ser analizadas.

## Métodos Físicos

### Polvos Dactilares

**Aplicación:**
- Superficies **lisas y no porosas** (vidrio, metal, plástico)
- Brochado suave en dirección de las crestas
- Contraste de color (polvo negro en superficies claras, viceversa)

**Tipos:**
- **Magnéticos:** Se aplican con brocha magnética, no dañan la huella
- **Regulares:** Brocha de fibras suaves
- **Fluorescentes:** Para superficies multicolores, se ven con luz UV

### Vapores de Cianoacrilato (Super Glue)

**Aplicación:**
- Cámara cerrada con calor
- Vapores se adhieren a la huella
- Luego se tiñe con colorante fluorescente

**Ventajas:**
- Fija permanentemente la huella
- Efectivo en plásticos, metales, cuero
- Permite ver detalles finos

## Métodos Químicos

### Ninhidrina

**Aplicación:**
- Superficies **porosas** (papel, cartón, madera sin tratar)
- Reacciona con aminoácidos del sudor
- Revela huellas de hasta años de antigüedad

**Resultado:**
- Color púrpura después de 24-48 horas
- Acelererable con calor y humedad

### DFO (1,8-Diazafluoren-9-one)

- Más sensible que ninhidrina
- Fluorescencia bajo luz especial
- Más costoso

### Nitrato de Plata

- Para papel
- Reacciona con cloruros del sudor
- Revela bajo luz UV
- Ennegrece con luz

## Huellas en Superficies Especiales

### Piel Humana (Cadáver)

- **Técnica:** Vapores de yodo, cianoacrilato
- **Dificultad:** Alta, tiempo limitado
- **Éxito:** Bajo, requiere experiencia

### Superficies Mojadas

- **Small Particle Reagent (SPR):** Suspensión que adhiere a residuos grasos
- Se aplica con spray

### Superficies Adhesivas (Cinta)

- **Crystal Violet:** Tiñe el adhesivo
- Revela huellas en el lado pegajoso

## Secuencia de Técnicas

**Orden correcto (no destructivo → destructivo):**

1. **Inspección visual** con luz oblicua o UV
2. **Fotografía** si son visibles
3. **Polvos** (recuperable si falla)
4. **Cianoacrilato** (fija permanente)
5. **Ninhidrina** u otros químicos (alteran la superficie)

⚠️ **NUNCA aplicar técnicas destructivas sin documentar primero.**`,
          `**Caso Práctico de Revelado**

**Escena:** Robo en oficina. Buscar huellas en:

A) Monitor de computadora (vidrio)
B) Hojas de papel del escritorio
C) Botella plástica de agua
D) Cinta adhesiva usada para atar cables

**Para cada superficie, indica:**
1. ¿Qué técnica usarías?
2. ¿En qué orden aplicarías las técnicas si usas más de una?

**Respuesta:**

**A) Monitor (vidrio - lisa no porosa):**
- **Polvos magnéticos** negros (contraste con superficie clara)
- Si hay huellas viejas: **cianoacrilato** primero, luego teñir

**B) Papel (porosa):**
- **Ninhidrina** (reacciona con aminoácidos)
- Esperar 24-48 horas
- Si es crucial: **DFO** (más sensible pero más costoso)

**C) Botella plástica (lisa no porosa):**
- **Polvos regulares** primero
- Si no funciona: **cianoacrilato** en cámara, luego polvo fluorescente

**D) Cinta adhesiva (superficie pegajosa):**
- **Crystal Violet** (tiñe el adhesivo)
- Técnica especializada para lado pegajoso`,
          false,
          [
            {
              title: "Quiz: Revelado de Huellas",
              instructions: "¿Qué técnica es apropiada para revelar huellas en papel?",
              options: [
                "Polvos magnéticos negros",
                "Ninhidrina (reacciona con aminoácidos)",
                "Super glue en cámara cerrada",
                "Small Particle Reagent en spray",
              ],
              correctAnswer: "Ninhidrina (reacciona con aminoácidos)",
              explanation:
                "La ninhidrina es la técnica química apropiada para superficies porosas como papel y cartón. Reacciona con los aminoácidos del sudor presentes en la huella y produce un color púrpura característico. Los polvos no funcionan en superficies porosas.",
            },
          ],
          "Técnico aplicando polvos dactilares con brocha suave sobre superficie de vidrio",
        ],
        [
          "Análisis y Cotejo de Huellas",
          `# Comparación de Huellas Dactilares

## Sistemas de Clasificación

### Clasificación General (Diseño)

1. **Arco** (A)
   - Sin delta ni núcleo claro
   - Crestas que cruzan de lado a lado
   - ~5% de la población

2. **Presilla** (I o E)
   - Un delta
   - Núcleo en forma de lazo
   - ~60-65% de la población
   - **Interna:** Abre hacia el meñique
   - **Externa:** Abre hacia el pulgar

3. **Verticilo** (V)
   - Dos o más deltas
   - Núcleo circular o espiral
   - ~30-35% de la población

### Minucias (Puntos Característicos)

Son los **detalles únicos** que permiten la identificación positiva:

- **Terminación:** Cresta que termina abruptamente
- **Bifurcación:** Cresta que se divide en dos
- **Punto:** Cresta muy corta
- **Lago:** Cresta que se bifurca y vuelve a unirse
- **Puente:** Cresta corta que une dos crestas
- **Gancho:** Bifurcación muy corta en un lado
- **Ojo:** Espacio circular rodeado de cresta
- **Fragmento:** Cresta corta aislada

## Criterios de Identificación

### Sistema de Puntos

Tradicionalmente se requerían **12 puntos coincidentes** para identificación positiva, pero el estándar moderno es más flexible:

**Factores considerados:**
- Claridad de la huella
- Número de minucias coincidentes
- Ausencia de diferencias inexplicables
- Rareza del patrón
- Experiencia del perito

### Metodología de Cotejo

**1. Análisis de Primer Nivel:**
- Tipo general de patrón (arco, presilla, verticilo)
- Elimina no coincidencias obvias

**2. Análisis de Segundo Nivel:**
- Ubicación y tipo de minucias
- Relación espacial entre puntos
- Mínimo recomendado: 8-12 puntos

**3. Análisis de Tercer Nivel:**
- Detalles microscópicos de las crestas
- Contorno, forma de poros
- Requiere tecnología avanzada

## Sistemas AFIS

**Automated Fingerprint Identification System**

- Base de datos digital de millones de huellas
- Búsqueda automatizada
- Propone candidatos similares
- **El perito humano confirma** la identificación final

## Errores y Limitaciones

### Huellas Parciales o de Baja Calidad
- Dificultan el cotejo
- Requieren más experiencia del perito
- Pueden ser no concluyentes

### Errores Humanos
- Sesgos de confirmación
- Fatiga del perito
- Presión de caso de alto perfil

**Estándar actual:** Verificación por segundo perito independiente

## Documentación del Cotejo

El informe pericial debe incluir:
- Descripción del patrón general
- Localización de cada minucia coincidente
- Fotografías ampliadas con marcadores
- Conclusión (identificación positiva, negativa, o no concluyente)
- Firma y acreditación del perito`,
          `**Ejercicio de Análisis**

Se presenta una huella latente de la escena y una huella indubitada del sospechoso.

**Tarea:**

1. Identifica el tipo de patrón general (arco, presilla, verticilo)
2. Localiza al menos 8 minucias en cada huella
3. Determina si coinciden
4. Redacta tu conclusión pericial

**Autoevaluación:**

- ¿Identificaste el patrón general correctamente?
- ¿Las minucias están correctamente clasificadas?
- ¿Hay suficientes puntos coincidentes para identificación positiva?
- ¿Tu conclusión está respaldada por los puntos observados?

*Nota: En un caso real, esto lo haría un perito certificado con software especializado.*`,
          false,
          [
            {
              title: "Quiz: Cotejo Dactiloscópico",
              instructions: "¿Qué son las 'minucias' en análisis de huellas dactilares?",
              options: [
                "Los tres tipos de patrones generales: arco, presilla, verticilo",
                "Detalles únicos como terminaciones y bifurcaciones de crestas",
                "El número de deltas presentes en la huella",
                "Las líneas principales que cruzan toda la huella",
              ],
              correctAnswer: "Detalles únicos como terminaciones y bifurcaciones de crestas",
              explanation:
                "Las minucias son los puntos característicos específicos de cada huella: terminaciones de crestas, bifurcaciones, puntos, lagos, etc. Son estos detalles únicos (no el patrón general) los que permiten la identificación positiva de una persona.",
            },
          ],
          "Comparación lado a lado de huellas dactilares con puntos característicos marcados y numerados",
        ],
      ],
    ],
    [
      "Balística y Documentología Forense",
      "Análisis de armas, proyectiles, escrituras y documentos cuestionados.",
      [
        [
          "Balística Forense Introductoria",
          `# Balística Forense

Ciencia que estudia las armas de fuego, proyectiles y efectos relacionados.

## Divisiones

### Balística Interna
Desde la detonación hasta la salida del proyectil del cañón.
- Presión, temperatura, gases
- Estrías del cañón en el proyectil

### Balística Externa
Trayectoria del proyectil en el aire.
- Alcance, velocidad, parábola
- Factores: gravedad, viento, rotación

### Balística de Efectos
Efectos del proyectil al impactar.
- Orificio de entrada vs salida
- Trayectoria en el cuerpo
- Distancia de disparo

## Evidencia Balística

### Casquillos
- Marcas del percutor
- Marcas del extractor y eyector
- Identifican el arma específica

### Proyectiles (Balas)
- Estrías del cañón (únicas por arma)
- Calibre
- Deformación por impacto

### Residuos de Disparo (GSR)
- Antimonio, bario, plomo
- En manos del tirador
- Duración: ~4-6 horas

## Determinación de Distancia

**Contacto:** Quemaduras, tatuaje denso, gases en herida
**Corta distancia (<50cm):** Tatuaje, quemaduras
**Media distancia (50cm-1m):** Ahumamiento sin tatuaje
**Larga distancia (>1m):** Solo orificio, sin residuos`,
          `**Caso de Análisis**

Víctima con herida de proyectil de arma de fuego. Autopsia revela:
- Orificio pequeño con anillo de contusión
- Tatuaje (partículas incrustadas) alrededor
- Quemaduras en bordes
- Gases en tejido subcutáneo

**Preguntas:**
1. ¿Es orificio de entrada o salida?
2. ¿A qué distancia aproximada se efectuó el disparo?
3. ¿Qué evidencia buscarías en la escena?

**Respuesta:**
1. **Entrada** (anillo de contusión característico)
2. **Contacto o muy corta distancia** (gases, quemaduras, tatuaje denso)
3. Buscar: **casquillos** (posición del tirador), **trayectoria** (ángulo), **residuos** en sospechoso, **arma** si está presente`,
          true,
          [
            {
              title: "Quiz: Balística Forense",
              instructions: "¿Qué evidencia permite identificar el arma específica que disparó?",
              options: [
                "El calibre del proyectil",
                "Las estrías únicas del cañón en el proyectil",
                "La marca del fabricante del casquillo",
                "La distancia del disparo",
              ],
              correctAnswer: "Las estrías únicas del cañón en el proyectil",
              explanation:
                "Cada arma deja estrías únicas en el proyectil debido a las imperfecciones microscópicas del interior del cañón. Mediante microscopio comparador, se pueden cotejar estrías del proyectil cuestionado con proyectil de prueba del arma sospechosa.",
            },
          ],
          "Microscopio comparador mostrando estrías de dos proyectiles lado a lado",
        ],
        [
          "Documentología Básica",
          `# Documentología Forense

Estudio científico de documentos cuestionados para determinar autenticidad o detectar alteraciones.

## Objetos de Estudio

- Manuscritos
- Firmas
- Documentos mecanografiados/impresos
- Billetes
- Cheques
- Documentos de identidad

## Análisis de Escritura Manual

### Características Generales (Clase)
- Inclinación
- Tamaño
- Proporción
- Espaciamiento
- Presión

### Características Individuales
- Rasgos iniciales y finales
- Enlaces entre letras
- Puntos de inicio y levantamiento
- Temblores naturales vs simulados

## Firmas

### Firma Auténtica
- Fluidez natural
- Presión variable
- Velocidad constante
- Rasgos automáticos

### Firma Falsificada

**Por imitación servil:**
- Lenta, trémula
- Repasos
- Detenciones

**A mano alzada:**
- Diferencias estructurales
- Rasgos generales pero no específicos

### Firma Disfrazada
Cuando el autor oculta su propia escritura:
- Cambio de inclinación
- Cambio de tamaño
- Torpeza fingida

## Alteraciones en Documentos

### Agregados
- Tinta diferente
- Trazo sobre trazo
- Interpolaciones

### Borraduras
- Mecánicas (raspado)
- Químicas (solventes)
- Detectables con luz oblicua, UV, o microscopia

### Enmiendas
- Tachaduras
- Correcciones
- Sobrescritos

## Análisis de Tintas

- **Comparación:** Misma o diferente tinta
- **Datación:** ¿Cuándo se escribió?
- **Secuencia:** ¿Qué se escribió primero?

Técnicas:
- Espectrofotometría
- Cromatografía
- Luz infrarroja y UV`,
          `**Ejercicio Práctico**

**Tarea:**
Escribe tu firma 5 veces en una hoja. Luego intenta falsificar la firma de un familiar (con su permiso).

**Análisis:**
1. Compara tus 5 firmas auténticas. ¿Qué varía y qué permanece constante?
2. En la firma falsificada, ¿se nota lentitud, repasos, detenciones?
3. ¿Podrías identificar cuál es la falsa sin saber de antemano?

**Conclusión:**
Incluso con práctica, la falsificación presenta signos de falta de automatismo. Un perito entrenado identifica estos signos microscópicos.`,
          false,
          [
            {
              title: "Quiz: Documentología",
              instructions: "¿Qué característica delata una firma falsificada por imitación servil?",
              options: [
                "La firma es demasiado perfecta y rápida",
                "Presenta lentitud, temblor y repasos",
                "Tiene el mismo tipo de tinta",
                "Es idéntica al original sin variaciones",
              ],
              correctAnswer: "Presenta lentitud, temblor y repasos",
              explanation:
                "La imitación servil (copiar viendo el modelo) produce una firma lenta y torpe. El falsificador debe pensar cada trazo, lo que genera temblores, detenciones y repasos. La firma auténtica es fluida y automática.",
            },
          ],
        ],
      ],
    ],
    [
      "Genética Forense y Evidencia Biológica",
      "ADN, análisis de fluidos, manchas de sangre y biología forense.",
      [
        [
          "ADN Forense",
          `# Genética Forense

El ADN (ácido desoxirribonucleico) contiene la información genética única de cada individuo.

## Fundamento

- **99.9% del ADN** es igual entre humanos
- **0.1%** varía (regiones polimórficas)
- Esa variación es lo que se analiza para identificación

## Fuentes de ADN

### Muestras Ideales (Alto contenido)
- Sangre
- Semen
- Saliva
- Tejido muscular
- Órganos

### Muestras Difíciles (Bajo contenido)
- Cabellos (con bulbo)
- Uñas
- Huesos
- Dientes
- Sudor (células descamadas)

## Proceso de Análisis

1. **Extracción:** Aislar ADN de la muestra
2. **Cuantificación:** Medir cantidad de ADN
3. **Amplificación:** PCR (copiar regiones específicas)
4. **Separación:** Electroforesis (separar fragmentos)
5. **Interpretación:** Comparar perfil genético

## Perfiles Genéticos (STRs)

Se analizan 13-20 regiones del ADN (loci):
- Cada locus tiene dos alelos (uno del padre, uno de la madre)
- El perfil es la combinación de todos los alelos
- Probabilidad de coincidencia al azar: 1 en varios billones

## Aplicaciones

- Identificación de víctimas
- Vinculación de sospechosos
- Exclusión de inocentes
- Pruebas de paternidad
- Identificación de restos humanos
- Bases de datos criminales (CODIS)

## Limitaciones

- **Calidad:** ADN degradado por tiempo, calor, humedad
- **Cantidad:** Muestra muy pequeña puede fallar
- **Contaminación:** ADN ajeno en la muestra
- **Costo:** Alto (en descenso)
- **Tiempo:** Días a semanas`,
          `**Caso Práctico**

**Escena:** Agresión sexual. Se recolecta:
- Hisopado vaginal con presunto semen
- Cabello sin bulbo encontrado en la víctima
- Sangre en la escena (desconocido si de víctima o agresor)
- Colilla de cigarrillo con saliva

**Preguntas:**
1. ¿Qué muestras son aptas para análisis de ADN?
2. ¿Cuál tiene mayor probabilidad de éxito?
3. ¿Qué muestra NO es útil para ADN?

**Respuesta:**
1. **Hisopado con semen** (excelente), **Sangre** (excelente), **Colilla con saliva** (buena), **Cabello sin bulbo** (muy difícil/imposible)
2. **Hisopado y sangre** son las mejores fuentes
3. **Cabello sin bulbo** no contiene células nucleadas (no tiene ADN nuclear analizable)`,
          true,
          [
            {
              title: "Quiz: ADN Forense",
              instructions: "¿Por qué el ADN es una herramienta de identificación tan poderosa?",
              options: [
                "Porque todas las personas tienen ADN idéntico",
                "Porque el perfil genético es único para cada individuo",
                "Porque se puede obtener solo de sangre fresca",
                "Porque es económico y rápido de analizar",
              ],
              correctAnswer: "Porque el perfil genético es único para cada individuo",
              explanation:
                "El perfil de ADN (combinación de alelos en múltiples loci) es prácticamente único para cada persona (excepto gemelos idénticos). La probabilidad de que dos personas no relacionadas tengan el mismo perfil es de 1 en varios billones.",
            },
          ],
          "Científico analizando secuencias de ADN en gel de electroforesis con bandas visibles",
        ],
        [
          "Análisis de Manchas de Sangre",
          `# Patrones de Manchas de Sangre (BPA)

El análisis de patrones de manchas de sangre permite reconstruir eventos violentos.

## Tipos de Manchas

### Pasivas (Gravedad)
**Gotas:**
- Forma: Circular si caen perpendicular
- Tamaño relacionado con altura de caída
- Bordes: Lisos a baja altura, con proyecciones a mayor altura

**Charcos:**
- Acumulación estática
- Sangre que fluye de herida o cuerpo

### Proyección (Fuerza)

**Impacto de Baja Velocidad:**
- Gotas grandes (>4mm)
- Goteo por gravedad, sangre escurrida

**Impacto de Media Velocidad:**
- Gotas medianas (1-4mm)
- Golpes, objetos contundentes

**Impacto de Alta Velocidad:**
- Gotas pequeñas (<1mm)
- Aerosol, disparo de arma de fuego

### Transferencia (Contacto)

**Limpiado/Barrido:**
- Objeto sangriento arrastrado sobre superficie
- Muestra dirección del movimiento

**Contacto:**
- Huella de mano, calzado, objeto
- Revela forma del objeto

## Determinación de Dirección

**Forma de la gota:**
- **Circular:** Impacto perpendicular (90°)
- **Elíptica:** Impacto angular
- **Cola:** Indica dirección del desplazamiento

**Ángulo de impacto:**
Se calcula con: Ancho / Largo = sen(ángulo)

## Punto de Origen

Mediante la convergencia de varias manchas se puede determinar:
- Altura aproximada de la fuente de sangre
- Posición de la víctima o agresor
- Movimientos durante el evento

## Secuencia de Eventos

El análisis permite reconstruir:
1. ¿Dónde estaba la víctima?
2. ¿Hubo movimiento después de la herida?
3. ¿Cuántos impactos?
4. ¿Qué tipo de arma/objeto?
5. ¿Hubo limpieza posterior?

## Limitaciones

- Superficie influye (porosa absorbe, lisa repele)
- Ropa absorbe y altera patrones
- Tiempo y ambiente degradan manchas
- Requiere experiencia para interpretación correcta`,
          `**Ejercicio de Análisis**

**Escena:** Habitación con múltiples manchas de sangre:
- Charco grande cerca de la cama
- Salpicaduras pequeñas (<1mm) en la pared
- Manchas elípticas medianas en el piso con "cola" apuntando a la puerta
- Huella de mano sangrienta en el marco de la puerta

**Preguntas:**
1. ¿Qué indican las salpicaduras pequeñas en la pared?
2. ¿Las manchas elípticas indican movimiento en qué dirección?
3. Reconstruye la secuencia del evento.

**Respuesta:**
1. **Impacto de alta velocidad** (posible disparo) o pulverización por fuerza (golpe violento)
2. **Hacia la puerta** (la cola de las gotas elípticas apunta en dirección del movimiento)
3. **Secuencia posible:** Agresión violenta cerca de la cama (charco = sangrado profuso), evento de alta velocidad (salpicaduras en pared), víctima o agresor se desplaza hacia puerta (gotas con dirección), contacto con marco al salir (huella)`,
          false,
          [
            {
              title: "Quiz: Manchas de Sangre",
              instructions: "¿Qué indica una mancha de sangre con forma muy elíptica (alargada)?",
              options: [
                "Cayó desde gran altura perpendicularmente",
                "Impactó en ángulo muy agudo (casi paralelo)",
                "Es sangre muy diluida con agua",
                "Proviene de un impacto de baja velocidad",
              ],
              correctAnswer: "Impactó en ángulo muy agudo (casi paralelo)",
              explanation:
                "Una gota elíptica (alargada) indica que impactó la superficie en un ángulo agudo, no perpendicular. Mientras más alargada, más agudo el ángulo. Una gota circular indica impacto perpendicular (90°).",
            },
          ],
        ],
      ],
    ],
    [
      "Reconstrucción de Hechos",
      "Metodología para reconstruir la dinámica del evento criminal.",
      [
        [
          "Principios de la Reconstrucción",
          `# Reconstrucción Criminalística

Método científico para **reproducir las circunstancias** en que ocurrió el hecho delictivo.

## Objetivos

1. Determinar **cómo** ocurrió el hecho
2. Establecer **secuencia** de eventos
3. Verificar o descartar **versiones** de testigos/implicados
4. Identificar **contradicciones** en declaraciones
5. Establecer **posiciones** y **movimientos** de víctima/victimario

## Principio Fundamental

> "La evidencia física no miente, no olvida, no se confunde."

La reconstrucción se basa en evidencia objetiva, no en testimonios subjetivos.

## Requisitos Previos

- Inspección completa de la escena
- Recolección total de evidencia
- Análisis de laboratorio completo
- Necropsia (si hay víctima fatal)
- Declaraciones de testigos e implicados
- Fotografías y planimetría
- Informes periciales

## Metodología

**1. Análisis de la Información**
- Revisar toda la evidencia
- Identificar puntos clave
- Detectar contradicciones

**2. Formulación de Hipótesis**
- ¿Qué pudo ocurrir?
- Considerar múltiples escenarios
- Priorizar los más probables

**3. Experimentación**
- Reproducir el hecho en condiciones controladas
- Usar maniquíes, actores, simulación digital
- Documentar con video y fotografía

**4. Evaluación de Resultados**
- ¿La hipótesis es compatible con la evidencia?
- ¿Qué escenarios quedan descartados?
- ¿Se puede determinar certeza o solo probabilidad?

**5. Conclusión**
- Descripción de la dinámica del hecho
- Grado de certeza (certeza, alta probabilidad, posible)
- Escenarios incompatibles con la evidencia

## Tipos de Reconstrucción

### Reconstructions Mentales
- Basadas en análisis de evidencia sin experimento físico
- Informe descriptivo

### Reconstrucciones Físicas
- Reproducción en la escena o lugar similar
- Con participantes, maniquíes
- Documentadas audiovisualmente

### Reconstrucciones Digitales
- Modelado 3D
- Simulación por computadora
- Animaciones forenses`,
          `**Caso de Estudio**

**Situación:**
Sospechoso afirma que la víctima lo atacó con cuchillo y él se defendió, causando la muerte en legítima defensa.

**Evidencia:**
- Víctima tiene 7 heridas de arma blanca (espalda y costados)
- Cuchillo encontrado a 3 metros del cuerpo
- No hay heridas defensivas en manos de la víctima
- Sospechoso no tiene lesiones

**Preguntas:**
1. ¿La versión del sospechoso es compatible con la evidencia?
2. ¿Qué elementos contradicen su versión?
3. ¿Qué hipótesis alternativa propones?

**Respuesta:**
1. **NO es compatible**
2. **Contradicciones:** (a) Heridas en espalda = víctima de espaldas o huyendo, no atacando; (b) 7 heridas = exceso, no defensa; (c) Sin heridas defensivas = víctima no empuñaba arma; (d) Sospechoso ileso = no hubo forcejeo real
3. **Hipótesis alternativa:** Sospechoso atacó a víctima por sorpresa o cuando huía, múltiples impactos indican ensañamiento, cuchillo colocado después para simular ataque`,
          true,
          [
            {
              title: "Quiz: Reconstrucción",
              instructions: "¿En qué se basa principalmente una reconstrucción criminalística?",
              options: [
                "En el testimonio del testigo principal",
                "En la confesión del sospechoso",
                "En la evidencia física objetiva",
                "En la experiencia del investigador",
              ],
              correctAnswer: "En la evidencia física objetiva",
              explanation:
                "La reconstrucción criminalística se basa primordialmente en la evidencia física y científica, que es objetiva y no cambia. Los testimonios son subjetivos, pueden ser falsos o imprecisos. La evidencia física no miente.",
            },
          ],
          "Reconstrucción digital 3D de escena del crimen con trayectorias y posiciones marcadas",
        ],
        [
          "Informe Pericial",
          `# El Dictamen Pericial

Documento técnico-científico que presenta los resultados de la investigación criminalística.

## Estructura del Informe

### 1. Preámbulo
- Autoridad solicitante
- Fecha y hora
- Número de caso
- Peritos intervinientes
- Acreditaciones y especialidad

### 2. Objeto
- ¿Qué se solicita dictaminar?
- Material recibido para análisis

### 3. Método
- Técnicas aplicadas
- Instrumentos utilizados
- Normas y protocolos seguidos

### 4. Observaciones / Descripción
- Descripción objetiva de lo analizado
- Estado de la evidencia
- Particularidades observadas

### 5. Estudios y Análisis
- Procedimientos realizados
- Resultados de cada prueba
- Hallazgos relevantes

### 6. Conclusiones
- Respuesta a los puntos periciales
- Basadas exclusivamente en hallazgos
- Lenguaje claro y preciso

### 7. Anexos
- Fotografías
- Gráficos, croquis
- Resultados de laboratorio
- Documentación de respaldo

## Lenguaje Pericial

**Usar:**
- Términos técnicos cuando es necesario (con explicación)
- Voz impersonal ("se observa", "se concluye")
- Tiempo pasado ("se analizó", "se encontró")
- Certeza proporcional a hallazgos

**Evitar:**
- Ambigüedades
- Opiniones personales no respaldadas
- Jerga innecesaria
- Interpretaciones legales (eso es del juez/fiscal)

## Grados de Certeza

**Categórico/Positivo:**
"Se concluye con certeza que..."

**Probable:**
"Es altamente probable que..."

**Posible:**
"Es posible, pero no concluyente..."

**Negativo:**
"Se descarta que..."

**No Concluyente:**
"La evidencia es insuficiente para determinar..."

## Principios del Perito

1. **Objetividad:** Sin sesgo hacia acusación o defensa
2. **Imparcialidad:** Solo la evidencia importa
3. **Integridad:** No falsear ni ocultar hallazgos
4. **Competencia:** Solo dictaminar en su área de experiencia
5. **Confidencialidad:** Información reservada al proceso

## Declaración en Juicio

El perito puede ser llamado a **ratificar** su dictamen ante el tribunal:
- Explicar en lenguaje accesible
- Defender la metodología
- Responder cuestionamientos de fiscalía y defensa
- Mantener posición técnica sin parcialidad`,
          `**Ejercicio de Redacción**

**Situación:**
Analizaste una huella dactilar de la escena. Encontraste 14 puntos característicos coincidentes con el sospechoso.

**Tarea:**
Redacta la sección de CONCLUSIONES del informe pericial.

**Elementos a incluir:**
- Tipo de evidencia
- Técnica aplicada
- Resultado del cotejo
- Grado de certeza
- Respuesta al punto pericial

**Autoevaluación:**
- ¿Usaste lenguaje técnico pero comprensible?
- ¿Indicaste el grado de certeza adecuado?
- ¿Evitaste interpretaciones legales?
- ¿La conclusión se basa en los hallazgos?`,
          false,
          [
            {
              title: "Quiz: Informe Pericial",
              instructions: "¿Qué debe evitar un perito en su dictamen?",
              options: [
                "Términos técnicos especializados",
                "Fotografías de la evidencia analizada",
                "Opiniones personales no respaldadas en evidencia",
                "Descripción detallada de la metodología",
              ],
              correctAnswer: "Opiniones personales no respaldadas en evidencia",
              explanation:
                "El perito debe basar sus conclusiones exclusivamente en hallazgos objetivos y evidencia científica, no en opiniones personales. El dictamen debe ser imparcial, objetivo y reproducible por otro perito.",
            },
          ],
          "Perito forense declarando en tribunal, presentando evidencia ante juez y abogados",
        ],
      ],
    ],
    [
      "Ética y Buenas Prácticas",
      "Ética profesional, errores comunes, integridad en la investigación criminalística.",
      [
        [
          "Ética del Criminalista",
          `# Ética Profesional en Criminalística

La criminalística tiene un impacto directo en la justicia y en la vida de las personas. La ética es fundamental.

## Principios Éticos Fundamentales

### 1. Búsqueda de la Verdad
- El objetivo es descubrir la verdad, no confirmar hipótesis preconcebidas
- La evidencia es sagrada, sin importar a quién favorezca o perjudique

### 2. Objetividad e Imparcialidad
- No trabajar para la acusación ni para la defensa, trabajar para la verdad
- No permitir que presión externa altere conclusiones
- No sesgar análisis por simpatía hacia víctima o acusado

### 3. Competencia Profesional
- Solo actuar dentro del área de expertise
- Capacitación continua
- Reconocer limitaciones propias
- No aparentar conocimientos que no se poseen

### 4. Integridad
- No falsificar evidencia jamás
- No ocultar hallazgos inconvenientes
- No modificar informes por presión
- Resistir corrupción y sobornos

### 5. Respeto a la Cadena de Custodia
- Proteger la evidencia
- Documentar meticulosamente
- Evitar contaminación

### 6. Confidencialidad
- No divulgar información del caso a no autorizados
- No hablar con medios sin autorización
- Proteger identidad de víctimas

## Dilemas Éticos Comunes

### Presión de Superiores
¿Qué hacer si un superior presiona para modificar conclusiones?

**Respuesta:** Mantener posición técnica, documentar la presión, reportar a instancia superior o comité de ética.

### Evidencia que Contradice la Teoría del Caso
¿Qué hacer si la evidencia no apoya la hipótesis del fiscal?

**Respuesta:** Reportar objetivamente los hallazgos. No es tu trabajo construir un caso, es descubrir la verdad.

### Error Descubierto Después
¿Qué hacer si descubres un error en un dictamen previo que ya fue presentado?

**Respuesta:** Informar inmediatamente a la autoridad, presentar corrección formal, asumir responsabilidad.

### Conflicto de Interés
¿Qué hacer si el acusado es un conocido personal?

**Respuesta:** Declararse impedido, solicitar que otro perito tome el caso.

## Consecuencias de Faltas Éticas

- **Disciplinarias:** Suspensión, destitución
- **Penales:** Falso testimonio, prevaricato, obstrucción de justicia
- **Civiles:** Demandas por daños
- **Profesionales:** Pérdida de acreditación, reputación destruida
- **Sociales:** Injusticia, inocentes condenados, culpables libres

## Casos Históricos de Fallas Éticas

**Brandon Mayfield (USA, 2004):**
Abogado erróneamente identificado como terrorista por huella dactilar. Sesgo de confirmación: FBI quería que fuera culpable porque era musulmán.

**Caso Dreyfus (Francia, 1894):**
Oficial falsamente condenado por traición. Análisis documentológico sesgado por antisemitismo.

Estos casos muestran el daño devastador de abandonar la objetividad.

## Código de Conducta

Todo criminalista debe:
- Actuar con honestidad en todo momento
- Rechazar presiones indebidas
- Admitir errores y limitaciones
- Mantener actualización profesional
- Respetar derechos humanos
- Colaborar con colegas éticamente
- Contribuir al avance de la ciencia forense`,
          `**Reflexión Ética**

**Escenario 1:**
Un fiscal te llama y dice: "Necesito que tu informe diga que la sangre es del acusado. El caso se cae si no lo confirmas. Todos sabemos que es culpable."

¿Qué haces?

**Escenario 2:**
Descubres que olvidaste documentar una transferencia en la cadena de custodia de evidencia clave de un caso de hace 6 meses. El juicio es mañana.

¿Qué haces?

**Escenario 3:**
Un periodista te ofrece dinero por "filtrar" detalles de un caso de alto perfil.

¿Qué haces?

**Autoevaluación:**
¿Priorizaste la verdad y la ética sobre conveniencia personal o presión externa? ¿Consideraste las consecuencias para la justicia?`,
          true,
          [
            {
              title: "Quiz: Ética Profesional",
              instructions: "¿Cuál es el objetivo principal del trabajo del criminalista?",
              options: [
                "Ayudar al fiscal a ganar el caso",
                "Proteger al acusado de injusticias",
                "Descubrir la verdad mediante evidencia científica",
                "Hacer quedar bien a la institución",
              ],
              correctAnswer: "Descubrir la verdad mediante evidencia científica",
              explanation:
                "El criminalista no trabaja para la acusación ni para la defensa, trabaja para la verdad. Su objetivo es analizar objetivamente la evidencia y reportar hallazgos sin sesgo, sin importar a quién favorezcan.",
            },
          ],
          "Criminalista jurando código ético, balanza de justicia y evidencias sobre mesa",
        ],
        [
          "Errores Comunes y Prevención",
          `# Errores Criminalísticos y Cómo Evitarlos

Los errores en criminalística pueden tener consecuencias devastadoras.

## Errores en la Escena

### 1. Contaminación
**Error:** Tocar, mover, alterar evidencia sin protección.
**Prevención:** Siempre usar EPP, fotografiar antes de tocar, limitar acceso.

### 2. Acordonamiento Insuficiente
**Error:** Perímetro muy pequeño, público ingresa.
**Prevención:** Acordonar de más, expandir es fácil, reducir es seguro.

### 3. Documentación Incompleta
**Error:** No fotografiar todo, no medir distancias.
**Prevención:** Checklist de documentación, fotografía de 3 distancias.

### 4. Pérdida de Evidencia Frágil
**Error:** No recolectar huellas, pelos, fibras antes de mover objetos.
**Prevención:** Procesar sistemáticamente, de frágil a robusto.

## Errores en Recolección

### 5. Embalaje Inadecuado
**Error:** Sangre húmeda en plástico sellado (se pudre).
**Prevención:** Conocer materiales apropiados por tipo de evidencia.

### 6. Contaminación Cruzada
**Error:** Usar mismos guantes para múltiples evidencias.
**Prevención:** Cambiar guantes entre ítems, embalar individualmente.

### 7. Etiquetado Insuficiente
**Error:** Etiqueta sin fecha, ubicación, o recolector.
**Prevención:** Etiquetar inmediatamente con toda la información.

## Errores de Análisis

### 8. Sesgo de Confirmación
**Error:** Ver solo lo que confirma la hipótesis inicial.
**Prevención:** Análisis ciego (sin conocer teoría del caso), revisión por segundo perito.

### 9. Sobreinterpretación
**Error:** Conclusiones más allá de lo que la evidencia permite.
**Prevención:** Grado de certeza proporcional a hallazgos.

### 10. Incompetencia Técnica
**Error:** Aplicar técnicas sin capacitación adecuada.
**Prevención:** Solo trabajar en área de expertise, pedir ayuda de especialistas.

## Errores Administrativos

### 11. Cadena de Custodia Rota
**Error:** No documentar transferencia, pérdida temporal de evidencia.
**Prevención:** Registro inmediato de cada transferencia, almacenamiento seguro.

### 12. Demora Excesiva
**Error:** No analizar evidencia a tiempo, degradación.
**Prevención:** Priorizar casos, refrigerar evidencia biológica.

## Errores de Comunicación

### 13. Informe Ambiguo
**Error:** Conclusiones poco claras, lenguaje confuso.
**Prevención:** Revisar informe, usar lenguaje preciso pero accesible.

### 14. No Admitir Limitaciones
**Error:** Aparentar certeza cuando no la hay.
**Prevención:** Ser honesto sobre limitaciones de la evidencia o técnica.

## Consecuencias de Errores

- **Evidencia inadmisible:** Caso se cae
- **Culpable absuelto:** Impunidad
- **Inocente condenado:** Injusticia grave
- **Responsabilidad penal:** Criminalista procesado
- **Pérdida de empleo:** Despido, reputación dañada

## Checklist de Prevención

**En la Escena:**
☐ EPP completo antes de ingresar
☐ Fotografía general-media-detalle
☐ Planimetría con medidas
☐ Búsqueda sistemática
☐ Recolección metódica

**En el Laboratorio:**
☐ Verificar cadena de custodia
☐ Documentar método
☐ Control de calidad
☐ Revisión por colega
☐ Almacenar remanentes

**En el Informe:**
☐ Revisión ortográfica y técnica
☐ Conclusiones basadas en hallazgos
☐ Grado de certeza apropiado
☐ Fotografías y anexos completos
☐ Firma y acreditación`,
          `**Análisis de Caso**

**Situación:**
Un criminalista llega a escena de homicidio. Sin ponerse guantes, mueve el arma para verificar el modelo. Luego la fotografía. No documenta quién más ingresó. Embala sangre húmeda en bolsa plástica sellada. La etiqueta dice "sangre" sin fecha ni ubicación.

**Preguntas:**
1. ¿Cuántos errores identificas?
2. ¿Cuál es el más grave?
3. ¿Qué consecuencias podrían tener?

**Respuesta:**
1. Al menos **7 errores**: (a) No usar guantes (contaminación), (b) Mover antes de fotografiar, (c) No documentar accesos, (d) Embalaje inadecuado para sangre húmeda, (e) Etiqueta incompleta sin fecha, (f) Sin ubicación exacta, (g) Sin identificación del recolector

2. **Más grave:** Contaminar el arma sin guantes (deja sus propias huellas, puede borrar las del autor) + Mover antes de documentar (se pierde contexto original)

3. **Consecuencias:** Evidencia inadmisible, huellas del criminalista en el arma confunden investigación, sangre se degrada y pierde ADN, cadena de custodia no se puede establecer, caso podría perderse en juicio`,
          false,
          [
            {
              title: "Quiz: Prevención de Errores",
              instructions: "¿Cuál es la mejor forma de prevenir sesgo de confirmación en análisis de evidencia?",
              options: [
                "Conocer bien la teoría del caso antes de analizar",
                "Análisis ciego sin conocer teoría, revisión por segundo perito",
                "Trabajar rápido para no pensar demasiado",
                "Confiar en la experiencia del criminalista principal",
              ],
              correctAnswer: "Análisis ciego sin conocer teoría, revisión por segundo perito",
              explanation:
                "El sesgo de confirmación se previene mediante análisis ciego (sin conocer la hipótesis del caso) y verificación independiente por un segundo perito que también trabaje sin conocer las conclusiones del primero.",
            },
          ],
        ],
        [
          "Integración y Caso Final",
          `# Integración de Conocimientos

Has recorrido los fundamentos de la criminalística. Ahora integraremos todo en un caso completo.

## Repaso de Conceptos Clave

### Escena del Hecho
- Protección y preservación
- Documentación fotográfica y planimetría
- Búsqueda sistemática

### Evidencia
- Identificación, recolección, embalaje
- Cadena de custodia ininterrumpida
- Análisis de laboratorio

### Identificación
- Huellas dactilares
- ADN
- Otros métodos

### Especialidades
- Balística
- Documentología
- Manchas de sangre

### Reconstrucción
- Formulación de hipótesis
- Experimentación
- Conclusiones basadas en evidencia

### Ética
- Objetividad e imparcialidad
- Competencia profesional
- Integridad

## Flujo Completo de Investigación

1. **Noticia del hecho** → Primera respuesta
2. **Protección** → Acordonamiento
3. **Documentación inicial** → Foto general, condiciones
4. **Inspección sistemática** → Búsqueda de evidencia
5. **Recolección** → Embalaje y etiquetado
6. **Transporte** → Cadena de custodia
7. **Análisis** → Laboratorios especializados
8. **Reconstrucción** → Integración de hallazgos
9. **Informe pericial** → Dictamen técnico
10. **Proceso judicial** → Presentación y ratificación

## Caso Integrador Final

**Se te presenta en la siguiente lección un caso completo para resolver aplicando todos los conocimientos adquiridos.**

Deberás:
- Analizar la escena
- Identificar evidencias relevantes
- Proponer técnicas de análisis
- Reconstruir la secuencia
- Redactar conclusiones

## Próximos Pasos

Este curso es solo el **inicio**. La criminalística es un campo vasto y en evolución constante.

**Para seguir aprendiendo:**
- Cursos especializados en cada área
- Prácticas supervisadas en laboratorios
- Lectura de literatura científica actualizada
- Participación en congresos y seminarios
- Certificaciones profesionales

**Recuerda siempre:**
> "La evidencia no miente. Tu trabajo es escucharla con la mente abierta y reportarla con honestidad."

¡Éxito en tu camino como futuro criminalista!`,
          `**CASO INTEGRADOR FINAL**

**Escenario:**

Vivienda en zona residencial. Vecino reporta no ver al propietario (varón, 45 años, vive solo) hace 3 días. Policía ingresa tras orden judicial.

**Hallazgos:**
- Cuerpo en sala, decúbito dorsal, múltiples heridas en tórax
- Charco de sangre bajo el cuerpo
- Salpicaduras de sangre en pared del fondo (pequeñas, <1mm)
- Gotas de sangre con forma elíptica desde sala hacia puerta trasera
- Puerta trasera con cerradura forzada
- Cuchillo de cocina sangriento en el piso a 2 metros del cuerpo
- Huella de calzado con sangre en pasillo
- Objetos de valor (TV, laptop) presentes, no fueron sustraídos
- Celular de la víctima sobre la mesa con notificaciones de hace 3 días

**TU MISIÓN:**

**Parte A - Procesamiento de la Escena (15 min)**
1. ¿Qué evidencias recolectarías y en qué orden de prioridad?
2. ¿Qué técnicas aplicarías para cada evidencia?
3. ¿Cómo las embalarías?

**Parte B - Análisis de Evidencias (15 min)**
4. ¿Qué revelan las salpicaduras pequeñas en la pared?
5. ¿Qué indican las gotas elípticas hacia la puerta?
6. ¿Qué análisis solicitarías para el cuchillo?
7. ¿Qué análisis para la huella de calzado?

**Parte C - Reconstrucción (15 min)**
8. Propón una secuencia lógica de los eventos.
9. ¿Qué hipótesis sobre el móvil del delito planteas? (apóyate en la evidencia)
10. ¿Qué evidencia podría contradecir la hipótesis de robo?

**Parte D - Informe (15 min)**
11. Redacta las conclusiones preliminares de tu dictamen (1 párrafo).

---

**Autoevaluación:**

Compara tus respuestas con los principios aprendidos:
- ¿Priorizaste evidencia frágil?
- ¿Aplicaste técnicas apropiadas?
- ¿Tu reconstrucción se basa en evidencia, no en suposiciones?
- ¿Tus conclusiones son objetivas y proporcionadas?

**¡Felicitaciones por completar el curso!**
Has dado el primer paso en el fascinante mundo de la criminalística.`,
          false,
          [
            {
              title: "Quiz Final: Integración",
              instructions: "En el caso final, ¿qué evidencia tiene MÁXIMA prioridad para recolectar primero?",
              options: [
                "El cuchillo con sangre",
                "La huella de calzado con sangre (frágil)",
                "El celular de la víctima",
                "El cuerpo de la víctima",
              ],
              correctAnswer: "La huella de calzado con sangre (frágil)",
              explanation:
                "La huella de calzado con sangre es evidencia FRÁGIL que puede degradarse, borrarse o contaminarse rápidamente. Se documenta y recolecta primero. El cuchillo y celular son evidencia robusta (pueden esperar), y el cuerpo debe ser documentado pero no se mueve hasta que toda la escena esté procesada.",
            },
          ],
        ],
      ],
    ],
  ],
};

