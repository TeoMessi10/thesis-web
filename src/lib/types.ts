// Dessa typer MÅSTE matcha Pydantic-modellerna i thesis-api/main.py.
// Ändrar du backend → uppdatera här i samma arbetspass.

export interface Company {
  id: string;
  ticker: string;
  name: string;
  sector: string | null;
  created_at: string;
}

export interface Source {
  page_number: number;
  similarity: number;
}

export interface AskResponse {
  answer: string;
  sources: Source[];
}

export interface ReportMetric {
  label: string;
  value: string; // exakt som i rapporten — ingen omräkning
  unit: string | null;
  page_number: number;
}

export interface MetricsResponse {
  quarter: string | null;
  metrics: ReportMetric[];
}
