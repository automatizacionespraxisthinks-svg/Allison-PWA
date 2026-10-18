/**
 * Una celda de los CSV del panel (se abren en Excel). Va entre comillas
 * y, si es texto que empieza como una fórmula (=, +, -, @, tabulador),
 * lleva un apóstrofo delante: un alumno que se llame "=HYPERLINK(...)"
 * no debe volverse una fórmula viva en el computador del administrador.
 * Los números se dejan como números.
 */
export function celdaCsv(v: string | number): string {
  const texto = typeof v === "string" && /^[=+\-@\t\r]/.test(v) ? `'${v}` : String(v);
  return `"${texto.replace(/"/g, '""')}"`;
}
