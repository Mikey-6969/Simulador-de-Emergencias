export const APP_TZ = "America/Bogota";
const BOGOTA_OFFSET_MS = -5 * 60 * 60 * 1000;

export function formatDateTime(value: Date | string | number) {
  return new Date(value).toLocaleString("es-CO", { timeZone: APP_TZ });
}

export function formatDate(value: Date | string | number) {
  return new Date(value).toLocaleDateString("es-CO", { timeZone: APP_TZ });
}

/** Start of the Bogotá calendar day containing `value`, as a UTC instant. */
export function startOfBogotaDay(value: Date) {
  const shifted = new Date(value.getTime() + BOGOTA_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - BOGOTA_OFFSET_MS);
}

export function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 86_400_000);
}

/** Monday 00:00 (Bogotá) of the week containing `value`. */
export function startOfBogotaWeek(value: Date) {
  const day = startOfBogotaDay(value);
  const weekday = new Date(day.getTime() + BOGOTA_OFFSET_MS).getUTCDay();
  const diff = (weekday + 6) % 7;
  return addDays(day, -diff);
}
