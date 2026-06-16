/* Rena formaterare (sv-SE) utan server-beroenden — säkra i klientkod. */

const sv = new Intl.NumberFormat("sv-SE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const fmtPrice = (v: number) => sv.format(v);
/** Signerat tal med riktigt minustecken (−), sv-SE-format. */
export const fmtSigned = (v: number) => `${v >= 0 ? "+" : "−"}${sv.format(Math.abs(v))}`;
export const fmtPct = (v: number) => `${fmtSigned(v)}%`;
