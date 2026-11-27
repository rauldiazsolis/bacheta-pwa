/** Fuente de tiempo. Inyectada para que los tests y la reproducción sean deterministas. */
export interface Reloj {
  /** Milisegundos monótonos (no retroceden si cambia la hora del sistema). */
  ahoraMs(): number;
  /** Fecha y hora actual en milisegundos desde 1970 (UTC). */
  fechaHoraMs(): number;
}
