// src/features/appointments/utils/dates.ts

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function addMonths(d: Date, months: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
}

export function addYears(d: Date, years: number): Date {
  const x = new Date(d);
  x.setFullYear(x.getFullYear() + years);
  return x;
}

// Semana Lunes->Domingo (para UX)
export function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay(); // Dom=0, Lun=1,...Sab=6
  const diffToMonday = day === 0 ? -6 : 1 - day;
  return addDays(x, diffToMonday);
}

export function endOfWeek(d: Date): Date {
  return endOfDay(addDays(startOfWeek(d), 6));
}

export function startOfMonth(d: Date): Date {
  return startOfDay(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function endOfMonth(d: Date): Date {
  return endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function startOfYear(d: Date): Date {
  return startOfDay(new Date(d.getFullYear(), 0, 1));
}

export function endOfYear(d: Date): Date {
  return endOfDay(new Date(d.getFullYear(), 11, 31));
}

// ✅ Para Spring LocalDateTime: ISO_DATE_TIME SIN zona (sin Z / sin +05:00)
export function toIsoLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
}

// "2025-12-25T10:30:00" -> "10:30"
export function formatTimeHHmm(iso: string): string {
  return iso.slice(11, 16);
}

const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export function formatDateLabel(d: Date): string {
  const dayName = d.toLocaleDateString("es-PE", { weekday: "long" });
  const dd = d.getDate();
  const monthName = MONTHS_ES[d.getMonth()];
  const yyyy = d.getFullYear();
  return `${dayName}, ${dd} de ${monthName} de ${yyyy}`;
}

export function formatMonthLabel(d: Date): string {
  const monthName = MONTHS_ES[d.getMonth()];
  const yyyy = d.getFullYear();
  return `${monthName} ${yyyy}`;
}

export function formatYearLabel(d: Date): string {
  return String(d.getFullYear());
}
