/**
 * CROW Media Quality Engine — SVG/HTML Renderers
 *
 * Pure renderers that produce SVG/HTML strings for each MediaSpec type.
 * These are used server-side (Node) and client-side (React) to generate
 * precise, accessible visuals with real text — never relying on AI for text.
 */

import type { MediaSpec, MediaOverlay } from "@/lib/ai/media-spec";

// ─── Color palette (CROW brand) ─────────────────────────────────────────────

const COLORS = {
  bg: "#0a0a0f",
  bgElevated: "#12121a",
  border: "#1e1e2e",
  text: "#f1f1f4",
  textMuted: "#8b8b9a",
  accent: "#a855f7",      // violet
  accentLight: "#c084fc",
  accentDark: "#7c3aed",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  grid: "#2a2a3e",
  nodeBg: "#1a1a24",
  nodeBorder: "#3a3a4e",
  edgeColor: "#4a4a5e",
};

const FONT_FAMILY = '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

// ─── Utility functions ──────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapSvg(content: string, width: number, height: number, viewBox?: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox ?? `0 0 ${width} ${height}`}" style="font-family: ${FONT_FAMILY}; background: transparent;">${content}</svg>`;
}

function rect(x: number, y: number, w: number, h: number, rx: number, fill: string, stroke?: string, strokeWidth = 1): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="${strokeWidth}"` : ""} />`;
}

function text(x: number, y: number, content: string, options: {
  fontSize?: number;
  fontWeight?: string;
  fill?: string;
  textAnchor?: "start" | "middle" | "end";
  dominantBaseline?: string;
  maxWidth?: number;
} = {}): string {
  const { fontSize = 14, fontWeight = "400", fill = COLORS.text, textAnchor = "start", dominantBaseline = "alphabetic" } = options;
  return `<text x="${x}" y="${y}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}">${escapeXml(content)}</text>`;
}

function line(x1: number, y1: number, x2: number, y2: number, stroke: string, strokeWidth = 1, strokeDasharray?: string): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}"${strokeDasharray ? ` stroke-dasharray="${strokeDasharray}"` : ""} />`;
}

function path(d: string, stroke: string, strokeWidth = 1, fill = "none", markerEnd?: string): string {
  return `<path d="${d}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="${fill}"${markerEnd ? ` marker-end="${markerEnd}"` : ""} />`;
}

function circle(cx: number, cy: number, r: number, fill: string, stroke?: string, strokeWidth = 1): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="${strokeWidth}"` : ""} />`;
}

function polygon(points: string, fill: string, stroke?: string, strokeWidth = 1): string {
  return `<polygon points="${points}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="${strokeWidth}"` : ""} />`;
}

// Arrowhead marker definition
const ARROWHEAD_MARKER = `
<defs>
  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 10 3.5, 0 7" fill="${COLORS.edgeColor}" />
  </marker>
</defs>`;

// ─── Renderers ──────────────────────────────────────────────────────────────

/**
 * Renders a diagram (architecture, system, anatomy, flow)
 */
export function renderDiagram(spec: MediaSpec, width = 800, height = 500): string {
  const data = spec.data as { nodes?: Array<{ id: string; label: string; type?: string; x?: number; y?: number }>; edges?: Array<{ from: string; to: string; label?: string }> } | undefined;
  const nodes = data?.nodes ?? [];
  const edges = data?.edges ?? [];

  if (nodes.length === 0) {
    return renderPlaceholder("Diagrama", "No hay datos de nodos", width, height);
  }

  // Simple force-directed layout fallback if positions not provided
  const positionedNodes = nodes.map((n, i) => ({
    ...n,
    x: n.x ?? 100 + (i % 4) * 180,
    y: n.y ?? 100 + Math.floor(i / 4) * 120,
  }));

  const nodeMap = new Map(positionedNodes.map((n) => [n.id, n]));

  let svg = ARROWHEAD_MARKER;

  // Edges first (behind nodes)
  for (const edge of edges) {
    const from = nodeMap.get(edge.from);
    const to = nodeMap.get(edge.to);
    if (!from || !to) continue;

    const cx1 = from.x + 80;
    const cy1 = from.y + 30;
    const cx2 = to.x + 80;
    const cy2 = to.y + 30;

    // Curved path
    const mx = (cx1 + cx2) / 2;
    const my = (cy1 + cy2) / 2 - 30;
    const d = `M ${cx1} ${cy1} Q ${mx} ${my} ${cx2} ${cy2}`;

    svg += path(d, COLORS.edgeColor, 2, "none", "url(#arrowhead)");

    if (edge.label) {
      svg += text(mx, my - 10, edge.label, { fontSize: 11, fill: COLORS.textMuted, textAnchor: "middle" });
    }
  }

  // Nodes
  for (const node of positionedNodes) {
    const typeColor = node.type === "input" ? COLORS.info : node.type === "output" ? COLORS.success : node.type === "decision" ? COLORS.warning : COLORS.accent;
    const isDecision = node.type === "decision";

    if (isDecision) {
      // Diamond shape
      const cx = node.x + 80;
      const cy = node.y + 30;
      const size = 50;
      svg += polygon(
        `${cx} ${cy - size}, ${cx + size} ${cy}, ${cx} ${cy + size}, ${cx - size} ${cy}`,
        COLORS.nodeBg,
        typeColor,
        2
      );
      svg += text(cx, cy + 5, node.label, { fontSize: 12, fontWeight: "600", fill: COLORS.text, textAnchor: "middle" });
    } else {
      // Rounded rect
      svg += rect(node.x, node.y, 160, 60, 12, COLORS.nodeBg, typeColor, 2);
      svg += text(node.x + 80, node.y + 35, node.label, { fontSize: 13, fontWeight: "600", fill: COLORS.text, textAnchor: "middle" });
    }
  }

  // Title
  svg += text(width / 2, 30, spec.title ?? "Diagrama", { fontSize: 18, fontWeight: "700", fill: COLORS.text, textAnchor: "middle" });

  return wrapSvg(svg, width, height);
}

/**
 * Renders a chart (bar, line, pie, area, scatter)
 */
export function renderChart(spec: MediaSpec, width = 800, height = 450): string {
  const data = spec.data as { type?: "bar" | "line" | "pie" | "area" | "scatter"; data?: Array<Record<string, unknown>>; xKey?: string; yKey?: string; series?: string[] } | undefined;
  const chartType = data?.type ?? "bar";
  const chartData = data?.data ?? [];
  const xKey = data?.xKey ?? "label";
  const yKey = data?.yKey ?? "value";

  if (chartData.length === 0) {
    return renderPlaceholder("Gráfico", "No hay datos para mostrar", width, height);
  }

  const margin = { top: 50, right: 40, bottom: 60, left: 70 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  let svg = ARROWHEAD_MARKER;

  if (chartType === "pie") {
    // Pie chart
    const total = chartData.reduce((sum, d) => sum + Number(d[yKey] ?? 0), 0);
    const centerX = width / 2;
    const centerY = height / 2 + 10;
    const radius = Math.min(innerW, innerH) / 2 - 20;
    let currentAngle = -Math.PI / 2;
    const palette = [COLORS.accent, COLORS.info, COLORS.success, COLORS.warning, COLORS.danger, COLORS.accentLight];

    for (let i = 0; i < chartData.length; i++) {
      const value = Number(chartData[i][yKey] ?? 0);
      const sliceAngle = (value / total) * 2 * Math.PI;
      const x1 = centerX + radius * Math.cos(currentAngle);
      const y1 = centerY + radius * Math.sin(currentAngle);
      const x2 = centerX + radius * Math.cos(currentAngle + sliceAngle);
      const y2 = centerY + radius * Math.sin(currentAngle + sliceAngle);
      const largeArc = sliceAngle > Math.PI ? 1 : 0;

      const d = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      svg += path(d, "none", 0, palette[i % palette.length]);

      // Label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + (radius * 1.15) * Math.cos(labelAngle);
      const labelY = centerY + (radius * 1.15) * Math.sin(labelAngle);
      svg += text(labelX, labelY + 5, String(chartData[i][xKey] ?? ""), { fontSize: 12, fill: COLORS.text, textAnchor: "middle" });

      // Value
      const valX = centerX + (radius * 0.6) * Math.cos(labelAngle);
      const valY = centerY + (radius * 0.6) * Math.sin(labelAngle);
      svg += text(valX, valY + 5, String(value), { fontSize: 11, fontWeight: "600", fill: "#fff", textAnchor: "middle" });

      currentAngle += sliceAngle;
    }
  } else {
    // Bar, Line, Area, Scatter - Cartesian
    const values = chartData.map((d) => Number(d[yKey] ?? 0));
    const maxVal = Math.max(...values, 1);
    const minVal = Math.min(...values, 0);
    const range = maxVal - minVal || 1;

    const xScale = (i: number) => margin.left + (i / Math.max(chartData.length - 1, 1)) * innerW;
    const yScale = (val: number) => margin.top + innerH - ((val - minVal) / range) * innerH;

    // Axes
    svg += line(margin.left, margin.top, margin.left, margin.top + innerH, COLORS.grid, 1);
    svg += line(margin.left, margin.top + innerH, margin.left + innerW, margin.top + innerH, COLORS.grid, 1);

    // Y grid lines & labels
    for (let i = 0; i <= 5; i++) {
      const y = margin.top + (i / 5) * innerH;
      const val = maxVal - (i / 5) * range;
      svg += line(margin.left, y, margin.left + innerW, y, COLORS.grid, 1, "4 4");
      svg += text(margin.left - 10, y + 4, val.toFixed(0), { fontSize: 11, fill: COLORS.textMuted, textAnchor: "end" });
    }

    // X labels
    chartData.forEach((d, i) => {
      const x = xScale(i);
      svg += text(x, margin.top + innerH + 20, String(d[xKey] ?? ""), { fontSize: 11, fill: COLORS.textMuted, textAnchor: "middle" });
    });

    if (chartType === "bar") {
      const barW = innerW / Math.max(chartData.length * 1.5, 2);
      chartData.forEach((d, i) => {
        const x = xScale(i) - barW / 2;
        const y = yScale(Number(d[yKey] ?? 0));
        const h = margin.top + innerH - y;
        svg += rect(x, y, barW, h, 4, COLORS.accent);
        // Value on top
        svg += text(x + barW / 2, y - 8, String(Number(d[yKey] ?? 0)), { fontSize: 11, fontWeight: "600", fill: COLORS.text, textAnchor: "middle" });
      });
    } else if (chartType === "line" || chartType === "area") {
      let d = "";
      chartData.forEach((pt, i) => {
        const x = xScale(i);
        const y = yScale(Number(pt[yKey] ?? 0));
        if (i === 0) d += `M ${x} ${y}`;
        else d += ` L ${x} ${y}`;
      });
      if (chartType === "area") {
        // Close the area
        const lastX = xScale(chartData.length - 1);
        const firstX = xScale(0);
        d += ` L ${lastX} ${margin.top + innerH} L ${firstX} ${margin.top + innerH} Z`;
        svg += path(d, "none", 0, `${COLORS.accent}33`);
      }
      svg += path(d, COLORS.accent, 3, "none");
      // Points
      chartData.forEach((pt, i) => {
        const x = xScale(i);
        const y = yScale(Number(pt[yKey] ?? 0));
        svg += circle(x, y, 5, COLORS.accent, COLORS.bg, 2);
      });
    } else if (chartType === "scatter") {
      chartData.forEach((pt, i) => {
        const x = xScale(i);
        const y = yScale(Number(pt[yKey] ?? 0));
        svg += circle(x, y, 6, COLORS.info, "none", 0);
      });
    }
  }

  // Title
  svg += text(width / 2, 30, spec.title ?? "Gráfico", { fontSize: 18, fontWeight: "700", fill: COLORS.text, textAnchor: "middle" });

  return wrapSvg(svg, width, height);
}

/**
 * Renders an infographic (composed sections with icons, titles, content)
 */
export function renderInfographic(spec: MediaSpec, width = 800, height = 600): string {
  const data = spec.data as { sections?: Array<{ title: string; content: string; icon?: string; number?: number }> } | undefined;
  const sections = data?.sections ?? [];
  const overlays = spec.overlays ?? [];

  let svg = "";
  const cardW = 220;
  const cardH = 160;
  const gap = 24;
  const cols = 3;
  const startX = (width - (cols * cardW + (cols - 1) * gap)) / 2;
  const startY = 80;

  // Background pattern
  svg += rect(0, 0, width, height, 0, COLORS.bg);
  // Subtle grid
  for (let x = 0; x < width; x += 40) svg += line(x, 0, x, height, COLORS.grid, 0.5);
  for (let y = 0; y < height; y += 40) svg += line(0, y, width, y, COLORS.grid, 0.5);

  sections.forEach((section, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cardW + gap);
    const y = startY + row * (cardH + gap);

    // Card
    svg += rect(x, y, cardW, cardH, 16, COLORS.bgElevated, COLORS.border, 1);

    // Icon/Number circle
    const circleX = x + cardW / 2;
    const circleY = y + 40;
    if (section.number) {
      svg += circle(circleX, circleY, 28, COLORS.accent);
      svg += text(circleX, circleY + 5, String(section.number), { fontSize: 14, fontWeight: "700", fill: "#fff", textAnchor: "middle" });
    } else if (section.icon) {
      svg += text(circleX, circleY + 5, section.icon, { fontSize: 28, textAnchor: "middle" });
    }

    // Title
    svg += text(circleX, y + 90, section.title, { fontSize: 14, fontWeight: "600", fill: COLORS.text, textAnchor: "middle" });

    // Content
    const lines = wrapText(section.content, cardW - 20, 12).slice(0, 3);
    lines.forEach((line, li) => {
      svg += text(circleX, y + 115 + li * 16, line, { fontSize: 11, fill: COLORS.textMuted, textAnchor: "middle" });
    });
  });

  // Overlays from spec.overlays
  overlays.forEach((o) => {
    const { x, y } = overlayPosition(o.position, width, height);
    svg += text(x, y, o.text, {
      fontSize: o.fontSize === "xl" ? 24 : o.fontSize === "lg" ? 18 : o.fontSize === "md" ? 14 : 11,
      fontWeight: o.style === "title" ? "700" : o.style === "number" ? "700" : "500",
      fill: o.style === "badge" ? COLORS.accent : COLORS.text,
      textAnchor: o.position.includes("left") ? "start" : o.position.includes("right") ? "end" : "middle",
    });
  });

  // Title
  svg += text(width / 2, 40, spec.title ?? "Infografía", { fontSize: 20, fontWeight: "700", fill: COLORS.text, textAnchor: "middle" });

  return wrapSvg(svg, width, height);
}

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  const charWidth = fontSize * 0.55;
  const maxChars = Math.floor(maxWidth / charWidth);

  for (const word of words) {
    if ((current + " " + word).length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function overlayPosition(pos: string, width: number, height: number): { x: number; y: number } {
  const padding = 30;
  switch (pos) {
    case "top": return { x: width / 2, y: padding };
    case "bottom": return { x: width / 2, y: height - padding };
    case "left": return { x: padding, y: height / 2 };
    case "right": return { x: width - padding, y: height / 2 };
    case "center": return { x: width / 2, y: height / 2 };
    case "top-left": return { x: padding, y: padding };
    case "top-right": return { x: width - padding, y: padding };
    case "bottom-left": return { x: padding, y: height - padding };
    case "bottom-right": return { x: width - padding, y: height - padding };
    default: return { x: width / 2, y: height / 2 };
  }
}

/**
 * Renders a timeline
 */
export function renderTimeline(spec: MediaSpec, width = 900, height = 400): string {
  const data = spec.data as { events?: Array<{ date: string; title: string; description?: string; icon?: string }> } | undefined;
  const events = data?.events ?? [];

  if (events.length === 0) {
    return renderPlaceholder("Línea de tiempo", "No hay eventos", width, height);
  }

  const margin = { left: 80, right: 80, top: 60, bottom: 60 };
  const innerW = width - margin.left - margin.right;
  const centerY = height / 2;

  let svg = ARROWHEAD_MARKER;

  // Main timeline line
  svg += line(margin.left, centerY, width - margin.right, centerY, COLORS.accent, 3);

  events.forEach((event, i) => {
    const x = margin.left + (i / Math.max(events.length - 1, 1)) * innerW;
    const isEven = i % 2 === 0;
    const boxY = isEven ? centerY - 180 : centerY + 50;
    const boxH = 120;
    const connectorY = isEven ? centerY - 180 : centerY + 170;

    // Connector line
    svg += line(x, centerY, x, connectorY, COLORS.edgeColor, 2, "4 4");

    // Event marker on timeline
    svg += circle(x, centerY, 10, COLORS.accent, COLORS.bg, 3);

    // Event card
    svg += rect(x - 160, boxY, 320, boxH, 12, COLORS.bgElevated, COLORS.border, 1);

    // Date badge
    svg += rect(x - 150, boxY + 16, 100, 28, 14, COLORS.accent);
    svg += text(x - 100, boxY + 30, event.date, { fontSize: 11, fontWeight: "600", fill: "#fff", textAnchor: "middle" });

    // Title
    svg += text(x, boxY + 60, event.title, { fontSize: 15, fontWeight: "700", fill: COLORS.text, textAnchor: "middle" });

    // Description
    if (event.description) {
      const lines = wrapText(event.description, 300, 12).slice(0, 3);
      lines.forEach((line, li) => {
        svg += text(x, boxY + 85 + li * 16, line, { fontSize: 11, fill: COLORS.textMuted, textAnchor: "middle" });
      });
    }
  });

  // Title
  svg += text(width / 2, 35, spec.title ?? "Línea de tiempo", { fontSize: 18, fontWeight: "700", fill: COLORS.text, textAnchor: "middle" });

  return wrapSvg(svg, width, height);
}

/**
 * Renders a process flow
 */
export function renderProcess(spec: MediaSpec, width = 800, height = 500): string {
  const data = spec.data as { steps?: Array<{ number: number; title: string; description: string; type?: "action" | "decision" | "start" | "end" }>; decisionPoints?: Array<{ step: number; question: string; yes: number; no: number }> } | undefined;
  const steps = data?.steps ?? [];

  if (steps.length === 0) {
    return renderPlaceholder("Proceso", "No hay pasos definidos", width, height);
  }

  const margin = { left: 50, right: 50, top: 80, bottom: 50 };
  const innerW = width - margin.left - margin.right;
  const stepW = Math.min(180, innerW / steps.length - 20);
  const stepH = 80;
  const gap = (innerW - steps.length * stepW) / Math.max(steps.length - 1, 1);

  let svg = ARROWHEAD_MARKER;

  steps.forEach((step, i) => {
    const x = margin.left + i * (stepW + gap);
    const y = margin.top;
    const isDecision = step.type === "decision";
    const isStart = step.type === "start";
    const isEnd = step.type === "end";

    // Shape
    if (isStart || isEnd) {
      // Pill shape
      const rx = stepH / 2;
      svg += rect(x, y, stepW, stepH, rx, isStart ? COLORS.success : COLORS.danger);
      svg += text(x + stepW / 2, y + stepH / 2 + 5, step.title, { fontSize: 13, fontWeight: "600", fill: "#fff", textAnchor: "middle" });
    } else if (isDecision) {
      // Diamond
      const cx = x + stepW / 2;
      const cy = y + stepH / 2;
      const size = stepW * 0.6;
      svg += polygon(`${cx} ${cy - size}, ${cx + size} ${cy}, ${cx} ${cy + size}, ${cx - size} ${cy}`, COLORS.nodeBg, COLORS.warning, 2);
      svg += text(cx, cy + 5, step.title, { fontSize: 12, fontWeight: "600", fill: COLORS.text, textAnchor: "middle" });
    } else {
      // Rounded rect
      svg += rect(x, y, stepW, stepH, 12, COLORS.nodeBg, COLORS.accent, 2);
      // Number badge
      svg += circle(x + 20, y + 20, 16, COLORS.accent);
      svg += text(x + 20, y + 24, String(step.number), { fontSize: 11, fontWeight: "700", fill: "#fff", textAnchor: "middle" });
      // Title
      svg += text(x + stepW / 2, y + stepH / 2 + 5, step.title, { fontSize: 13, fontWeight: "600", fill: COLORS.text, textAnchor: "middle" });
    }

    // Description below
    const descLines = wrapText(step.description, stepW + 40, 11).slice(0, 2);
    descLines.forEach((line, li) => {
      svg += text(x + stepW / 2, y + stepH + 20 + li * 14, line, { fontSize: 10, fill: COLORS.textMuted, textAnchor: "middle" });
    });

    // Arrow to next
    if (i < steps.length - 1) {
      const nextX = margin.left + (i + 1) * (stepW + gap);
      const d = `M ${x + stepW} ${y + stepH / 2} L ${nextX} ${y + stepH / 2}`;
      svg += path(d, COLORS.edgeColor, 2, "none", "url(#arrowhead)");
    }
  });

  // Title
  svg += text(width / 2, 40, spec.title ?? "Proceso", { fontSize: 18, fontWeight: "700", fill: COLORS.text, textAnchor: "middle" });

  return wrapSvg(svg, width, height);
}

/**
 * Renders a comparison table/cards
 */
export function renderComparison(spec: MediaSpec, width = 800, height = 450): string {
  const data = spec.data as { criteria?: string[]; items?: Array<{ name: string; values: (string | number)[]; highlight?: boolean }> } | undefined;
  const criteria = data?.criteria ?? [];
  const items = data?.items ?? [];

  if (criteria.length === 0 || items.length === 0) {
    return renderPlaceholder("Comparativa", "Faltan criterios o elementos", width, height);
  }

  const colCount = criteria.length + 1;
  const colW = (width - 100) / colCount;
  const rowH = 50;
  const startX = 50;
  const startY = 80;

  let svg = "";

  // Header
  svg += rect(startX, startY, width - 100, rowH, 0, COLORS.accent);
  svg += text(startX + colW / 2, startY + rowH / 2 + 5, "Criterio", { fontSize: 13, fontWeight: "700", fill: "#fff", textAnchor: "middle" });
  criteria.forEach((c, i) => {
    const x = startX + colW + i * colW;
    svg += text(x + colW / 2, startY + rowH / 2 + 5, c, { fontSize: 13, fontWeight: "600", fill: "#fff", textAnchor: "middle" });
    if (i < criteria.length - 1) svg += line(x + colW, startY, x + colW, startY + rowH, "rgba(255,255,255,0.2)", 1);
  });

  // Rows
  items.forEach((item, ri) => {
    const y = startY + rowH + ri * rowH;
    const bg = ri % 2 === 0 ? COLORS.bgElevated : COLORS.bg;
    svg += rect(startX, y, width - 100, rowH, 0, bg, COLORS.border, 0.5);

    // Name column
    svg += text(startX + colW / 2, y + rowH / 2 + 5, item.name, { fontSize: 12, fontWeight: item.highlight ? "700" : "500", fill: item.highlight ? COLORS.accent : COLORS.text, textAnchor: "middle" });

    // Value columns
    item.values.forEach((val, ci) => {
      const x = startX + colW + ci * colW;
      svg += text(x + colW / 2, y + rowH / 2 + 5, String(val), { fontSize: 12, fontWeight: "500", fill: COLORS.text, textAnchor: "middle" });
      if (ci < criteria.length - 1) svg += line(x + colW, y, x + colW, y + rowH, COLORS.border, 0.5);
    });

    // Vertical separators
    for (let i = 0; i < criteria.length; i++) {
      const x = startX + colW + i * colW;
      svg += line(x, startY, x, y + rowH, COLORS.border, 0.5);
    }
  });

  // Title
  svg += text(width / 2, 40, spec.title ?? "Comparativa", { fontSize: 18, fontWeight: "700", fill: COLORS.text, textAnchor: "middle" });

  return wrapSvg(svg, width, height);
}

/**
 * Renders code visual (syntax highlighted + optional flow)
 */
export function renderCodeVisual(spec: MediaSpec, width = 800, height = 500): string {
  const data = spec.data as { language?: string; code?: string; explanation?: string; flowDiagram?: { nodes: unknown[]; edges: unknown[] } } | undefined;
  const language = data?.language ?? "typescript";
  const code = data?.code ?? "// Sin código";
  const explanation = data?.explanation ?? "";

  let svg = "";
  const codeX = 40;
  const codeY = 80;
  const codeW = width - 80;
  const lineHeight = 22;
  const padding = 20;

  // Code background
  const codeLines = code.split("\n");
  const codeH = codeLines.length * lineHeight + padding * 2;
  svg += rect(codeX, codeY, codeW, codeH, 12, "#0d0d12", COLORS.border, 1);

  // Language badge
  svg += rect(codeX + 16, codeY + 16, 80, 24, 6, COLORS.accent);
  svg += text(codeX + 56, codeY + 30, language.toUpperCase(), { fontSize: 10, fontWeight: "600", fill: "#fff", textAnchor: "middle" });

  codeLines.forEach((line, i) => {
    const y = codeY + padding + i * lineHeight + 16;
    // Line number
    svg += text(codeX + 20, y, String(i + 1), { fontSize: 11, fill: COLORS.textMuted, textAnchor: "end" });
    // Code (simplified highlighting)
    const highlighted = highlightCode(line);
    let x = codeX + 60;
    for (const [token, color] of highlighted) {
      svg += text(x, y, token, { fontSize: 12, fill: color });
      x += token.length * 7.2; // approximate char width
    }
  });

  // Explanation below
  if (explanation) {
    const expY = codeY + codeH + 30;
    svg += text(width / 2, expY, explanation, { fontSize: 13, fill: COLORS.textMuted, textAnchor: "middle" });
  }

  // Title
  svg += text(width / 2, 40, spec.title ?? "Código", { fontSize: 18, fontWeight: "700", fill: COLORS.text, textAnchor: "middle" });

  return wrapSvg(svg, width, Math.max(height, codeH + 150));
}

function highlightCode(line: string): Array<[string, string]> {
  // Very simple tokenizer for demo
  const tokens: Array<[string, string]> = [];
  const patterns = [
    { pattern: /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|finally|throw|new|this|super|extends|implements|interface|type|enum)\b/, color: COLORS.accentLight },
    { pattern: /\b(true|false|null|undefined)\b/, color: COLORS.warning },
    { pattern: /"[^"]*"|'[^']*'|`[^`]*`/, color: COLORS.success },
    { pattern: /\b\d+(\.\d+)?\b/, color: COLORS.warning },
    { pattern: /\/\/.*$/, color: COLORS.textMuted },
    { pattern: /\b[a-zA-Z_$][a-zA-Z0-9_$]*\s*(?=\()/ , color: COLORS.info },
    { pattern: /[+\-*/%=<>!&|^~?:]/, color: COLORS.textMuted },
  ];

  let remaining = line;

  while (remaining.length > 0) {
    let matched = false;
    for (const { pattern, color } of patterns) {
      const match = remaining.match(pattern);
      if (match && match.index === 0) {
        tokens.push([match[0], color]);
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.push([remaining[0], COLORS.text]);
      remaining = remaining.slice(1);
    }
  }

  return tokens;
}

/**
 * Renders IMAGE_WITH_OVERLAY - base image placeholder + overlay text
 * Note: The actual base image comes from Leonardo. This renders the overlay layer.
 */
export function renderImageWithOverlay(spec: MediaSpec, width = 800, height = 500): string {
  const data = spec.data as { baseImagePrompt?: string; overlays?: MediaOverlay[] } | undefined;
  const overlays = spec.overlays ?? data?.overlays ?? [];

  let svg = "";

  // Placeholder for Leonardo image (transparent - actual image is separate)
  svg += rect(0, 0, width, height, 0, "transparent");

  // Overlay text elements
  overlays.forEach((o) => {
    const { x, y } = overlayPosition(o.position, width, height);
    const style = o.style ?? "label";
    const fontSize = o.fontSize === "xl" ? 28 : o.fontSize === "lg" ? 20 : o.fontSize === "md" ? 16 : 12;

    // Background for readability
    const textWidth = o.text.length * fontSize * 0.55;
    const textHeight = fontSize * 1.4;
    const paddingX = 12;

    let bgX = x - paddingX;
    const bgY = y - fontSize * 0.8;
    if (o.position.includes("left")) bgX = x - paddingX;
    else if (o.position.includes("right")) bgX = x - textWidth - paddingX;
    else bgX = x - textWidth / 2 - paddingX;

    svg += rect(bgX, bgY, textWidth + paddingX * 2, textHeight, 8, "rgba(10,10,15,0.85)", COLORS.accent, 1);
    svg += text(x, y + fontSize * 0.1, o.text, {
      fontSize,
      fontWeight: style === "title" ? "700" : style === "number" ? "700" : "500",
      fill: style === "badge" ? COLORS.accent : "#fff",
      textAnchor: o.position.includes("left") ? "start" : o.position.includes("right") ? "end" : "middle",
    });
  });

  return wrapSvg(svg, width, height);
}

/**
 * Placeholder for missing data
 */
function renderPlaceholder(title: string, message: string, width: number, height: number): string {
  let svg = rect(0, 0, width, height, 0, COLORS.bg);
  svg += text(width / 2, height / 2 - 20, title, { fontSize: 24, fontWeight: "700", fill: COLORS.text, textAnchor: "middle" });
  svg += text(width / 2, height / 2 + 20, message, { fontSize: 14, fill: COLORS.textMuted, textAnchor: "middle" });
  return wrapSvg(svg, width, height);
}

// ─── Main render dispatcher ────────────────────────────────────────────────

export function renderMediaSpec(spec: MediaSpec, width = 800, height = 500): string {
  switch (spec.type) {
    case "DIAGRAM":
      return renderDiagram(spec, width, height);
    case "CHART":
      return renderChart(spec, width, height);
    case "INFOGRAPHIC":
      return renderInfographic(spec, width, height);
    case "TIMELINE":
      return renderTimeline(spec, width, height);
    case "PROCESS":
      return renderProcess(spec, width, height);
    case "COMPARISON":
      return renderComparison(spec, width, height);
    case "CODE_VISUAL":
      return renderCodeVisual(spec, width, height);
    case "IMAGE_WITH_OVERLAY":
      return renderImageWithOverlay(spec, width, height);
    case "IMAGE":
    default:
      // For pure IMAGE, we return empty SVG - Leonardo handles it
      return "";
  }
}

// ─── React components for client-side rendering ────────────────────────────
// These are exported for use in the lesson player
import React from "react";

export function MediaSpecToSVG({ spec, width = 800, height = 500 }: { spec: MediaSpec; width?: number; height?: number }): React.ReactElement {
  const svgString = renderMediaSpec(spec, width, height);
  return React.createElement("div", { dangerouslySetInnerHTML: { __html: svgString }, style: { width, height } });
}