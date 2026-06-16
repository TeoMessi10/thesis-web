/* SVG-vägar för PriceChart — ren beräkning utan server-beroenden. */

export interface ChartData {
  linePath: string;
  areaPath: string;
  end: { x: number; y: number };
  gridLabels: string[];
}

/** Bygger SVG-vägar för PriceChart (viewBox 520×230; kurvan ritas 0–466 × 50–200). */
export function buildChart(closes: number[]): ChartData {
  const X1 = 466;
  const TOP = 50;
  const BOT = 200;
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;

  const pts = closes.map((p, i) => {
    const x = Math.round((i / (closes.length - 1)) * X1 * 10) / 10;
    const y = Math.round((BOT - ((p - min) / span) * (BOT - TOP)) * 10) / 10;
    return [x, y] as const;
  });

  const linePath = `M${pts.map(([x, y]) => `${x},${y}`).join(" L")}`;
  const areaPath = `${linePath} L${X1},230 L0,230 Z`;
  const [ex, ey] = pts[pts.length - 1];

  /* Prisnivåer vid gridlinjerna y=40/100/160 (extrapolerat ovanför kurvtoppen). */
  const priceAt = (y: number) => max - ((y - TOP) / (BOT - TOP)) * span;
  const gridLabels = [40, 100, 160].map((y) => String(Math.round(priceAt(y))));

  return { linePath, areaPath, end: { x: ex, y: ey }, gridLabels };
}
